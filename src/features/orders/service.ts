import "server-only";
import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { getPaymentProvider } from "@/lib/integrations/payments";
import { notify } from "@/lib/integrations/notifications";
import { resolveOwner, loadCartForCheckout } from "@/features/cart/service";
import { computeTotals } from "@/features/cart/pricing";
import { checkPromo } from "@/features/promo/validate";
import { freeShippingThreshold } from "@/features/cms/queries";
import { pickLocalized } from "@/lib/localized";
import { defaultLocale } from "@/config/site";
import type { CheckoutData } from "./schemas";
import { canTransition, formatOrderNumber } from "./status";
import { getAppUrl } from "@/lib/app-url";

export type CreateOrderResult = { orderId: string; number: string; redirectUrl: string | null };

/**
 * Creates an order from the current cart in a single transaction:
 * validates stock & promo, atomically decrements inventory, records promo usage,
 * snapshots line items, clears the cart. Payment is initiated after commit.
 */
export async function createOrder(input: CheckoutData, locale: Locale): Promise<CreateOrderResult> {
  const user = await getCurrentUser();
  const owner = await resolveOwner({ create: false });
  if (!owner) throw new AppError("cart_empty");
  const threshold = await freeShippingThreshold();

  const order = await db.$transaction(async (tx) => {
    const cart = await loadCartForCheckout(owner);
    if (!cart || cart.items.length === 0) throw new AppError("cart_empty");

    const lines = cart.items.map((item) => {
      const v = item.variant;
      const p = v.product;
      const stock = v.inventory?.quantity ?? 0;
      if (!p.isActive || !v.isActive) throw new AppError("cart_changed", 409, { variantId: v.id });
      if (stock < item.quantity) throw new AppError("insufficient_stock", 409, { variantId: v.id, available: stock });
      const tr = p.translations.find((t) => t.locale === locale) ?? p.translations.find((t) => t.locale === defaultLocale);
      return {
        productId: p.id,
        variantId: v.id,
        name: tr?.name ?? p.slug,
        variantName: p._count.variants > 1 ? pickLocalized(v.name, locale) : null,
        imageUrl: p.images[0]?.url ?? null,
        unitPrice: v.price,
        quantity: item.quantity,
        total: v.price * item.quantity,
      };
    });

    const subtotal = lines.reduce((s, l) => s + l.total, 0);

    // Promo: re-validated server-side at order time (cart value may have changed).
    let discount = 0;
    let promoId: string | null = null;
    if (cart.promoCode) {
      const promo = await tx.promoCode.findUnique({ where: { code: cart.promoCode } });
      const usage = promo
        ? await tx.promoCodeUsage.count({
            where: { promoCodeId: promo.id, OR: [{ email: input.email }, ...(user ? [{ userId: user.id }] : [])] },
          })
        : 0;
      const check = checkPromo(promo, { subtotal, userUsageCount: usage });
      if (!check.ok) throw new AppError(check.error, 400, check.meta);
      discount = check.discount;
      promoId = promo!.id;
      // Atomic usage-limit guard against concurrent redemptions
      const claimed = await tx.promoCode.updateMany({
        where: { id: promo!.id, ...(promo!.usageLimit !== null ? { usedCount: { lt: promo!.usageLimit } } : {}) },
        data: { usedCount: { increment: 1 } },
      });
      if (claimed.count === 0) throw new AppError("promo_limit");
    }

    const totals = computeTotals(lines, { discount, deliveryMethod: input.deliveryMethod, freeShippingThreshold: threshold });

    // Atomic stock decrement: fails if someone else bought the last units meanwhile.
    for (const l of lines) {
      const res = await tx.inventory.updateMany({
        where: { variantId: l.variantId, quantity: { gte: l.quantity } },
        data: { quantity: { decrement: l.quantity } },
      });
      if (res.count === 0) throw new AppError("insufficient_stock", 409, { variantId: l.variantId });
      await tx.product.update({ where: { id: l.productId }, data: { salesCount: { increment: l.quantity } } });
    }

    const created = await tx.order.create({
      data: {
        userId: user?.id ?? null,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        city: input.city,
        deliveryMethod: input.deliveryMethod,
        deliveryBranch: input.branch || null,
        deliveryAddress: input.address || null,
        comment: input.comment || null,
        paymentMethod: input.paymentMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        promoCodeId: promoId,
        locale,
        items: { create: lines },
        events: { create: { status: "NEW", message: "Order created" } },
      },
    });

    if (promoId) {
      await tx.promoCodeUsage.create({
        data: { promoCodeId: promoId, userId: user?.id ?? null, orderId: created.id, email: input.email, discount: totals.discount },
      });
    }

    if (user && input.saveAddress) {
      const count = await tx.address.count({ where: { userId: user.id } });
      await tx.address.create({
        data: {
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          city: input.city,
          deliveryMethod: input.deliveryMethod,
          branch: input.branch || null,
          street: input.address || null,
          isDefault: count === 0,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { promoCode: null } });
    return created;
  });

  const number = formatOrderNumber(order.number);
  notify({ type: "order_created", to: order.email, orderNumber: number, total: formatPrice(order.total, locale) });
  notify({ type: "admin_new_order", orderNumber: number, total: formatPrice(order.total, locale) });

  let redirectUrl: string | null = null;
  if (order.paymentMethod === "CARD_ONLINE") {
    redirectUrl = await startPayment(order.id);
  }
  return { orderId: order.id, number, redirectUrl };
}

/** Initiates (or re-initiates) online payment. Returns redirect URL or null on failure. */
export async function startPayment(orderId: string): Promise<string | null> {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.paymentStatus === "PAID") return null;
  const provider = getPaymentProvider();
  const appUrl = getAppUrl();
  try {
    const result = await provider.createPayment({
      orderId: order.id,
      orderNumber: formatOrderNumber(order.number),
      amount: order.total,
      currency: order.currency,
      description: `AsiaShop ${formatOrderNumber(order.number)}`,
      customerEmail: order.email,
      locale: order.locale,
      returnUrl: `${appUrl}/checkout/success/${order.id}`,
      callbackUrl: `${appUrl}/api/payments/${provider.id}/webhook`,
    });
    if (result.type === "failed") {
      await db.orderEvent.create({ data: { orderId, message: `Payment init failed: ${result.reason}` } });
      return null;
    }
    await db.payment.create({
      data: { orderId, provider: provider.id, providerRef: result.providerRef, amount: order.total, status: result.type === "paid" ? "PAID" : "PENDING" },
    });
    if (result.type === "paid") {
      await applyPaymentStatus(result.providerRef, "PAID", null);
      return null;
    }
    return result.url;
  } catch (err) {
    console.error("[payment] init error", err);
    await db.orderEvent.create({ data: { orderId, message: "Payment init error" } });
    return null;
  }
}

/** Idempotently applies a provider payment status (from webhook or mock page). */
export async function applyPaymentStatus(providerRef: string, status: PaymentStatus, raw: unknown) {
  const payment = await db.payment.findUnique({ where: { providerRef }, include: { order: true } });
  if (!payment) throw new AppError("not_found", 404);
  if (payment.status === status) return payment.order;
  if (payment.status === "PAID" && status !== "REFUNDED") return payment.order; // never downgrade a paid payment
  await db.$transaction([
    db.payment.update({ where: { id: payment.id }, data: { status, raw: raw === null ? undefined : (raw as Prisma.InputJsonValue) } }),
    db.order.update({ where: { id: payment.orderId }, data: { paymentStatus: status } }),
    db.orderEvent.create({ data: { orderId: payment.orderId, message: `Payment ${status.toLowerCase()} (${payment.provider})` } }),
  ]);
  return payment.order;
}

/** Admin status change with inventory restoration on cancellation. */
export async function changeOrderStatus(orderId: string, to: OrderStatus, note?: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new AppError("not_found", 404);
    if (order.status === to) return order;
    if (!canTransition(order.status, to)) throw new AppError("invalid_transition", 400);
    if (to === "CANCELLED") {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.inventory.updateMany({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity } } });
        }
        if (item.productId) {
          await tx.product.updateMany({ where: { id: item.productId, salesCount: { gte: item.quantity } }, data: { salesCount: { decrement: item.quantity } } });
        }
      }
      if (order.promoCodeId) {
        await tx.promoCode.updateMany({ where: { id: order.promoCodeId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
        await tx.promoCodeUsage.deleteMany({ where: { orderId } });
      }
    }
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: to,
        ...(to === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY" ? { paymentStatus: "PAID" } : {}),
        events: { create: { status: to, message: note || `Status → ${to}` } },
      },
    });
    notify({ type: "order_status", to: order.email, orderNumber: formatOrderNumber(order.number), status: to });
    return updated;
  });
}

export async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  const order = await db.order.findFirst({ where: { id: orderId, userId }, include: { items: true, events: { orderBy: { createdAt: "asc" } }, promoCode: true } });
  return order;
}
