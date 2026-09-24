/**
 * Integration tests against the real database (DATABASE_URL from .env).
 * Skipped automatically when no database is configured.
 * `next/headers` is replaced with an in-memory cookie jar so services that
 * read the session / guest cookie run exactly as in a request.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
  headers: async () => new Headers({ "user-agent": "vitest", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/i18n/navigation", () => ({
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "uk" }));

const hasDb = !!process.env.DATABASE_URL;
const RUN = `it${Date.now().toString(36)}`;

describe.skipIf(!hasDb)("integration: products → cart → orders → admin", async () => {
  const { db } = await import("@/lib/db");
  const { saveProduct, deleteProducts } = await import("@/features/admin/products/service");
  const { productInputSchema } = await import("@/features/admin/products/schema");
  const cart = await import("@/features/cart/service");
  const orders = await import("@/features/orders/service");
  const { checkoutSchema } = await import("@/features/orders/schemas");
  const { requirePermission } = await import("@/lib/auth/guards");
  const { createSession } = await import("@/lib/auth/session");
  const { hashPassword } = await import("@/lib/auth/password");

  let productId = "";
  let variantId = "";
  let customerId = "";
  const promoCode = `${RUN.toUpperCase()}PCT`;

  beforeAll(async () => {
    const category = await db.category.findFirstOrThrow({ where: { slug: "snacks" } });
    const product = await saveProduct(
      productInputSchema.parse({
        slug: `${RUN}-snack`,
        translations: { uk: { name: `Тест ${RUN}`, shortDescription: "Тестовий товар" }, ru: {}, en: { name: `Test ${RUN}` } },
        categoryId: category.id,
        brandName: "Test Brand",
        tags: "snack, salty",
        variants: [{ sku: `${RUN}-SKU`.toUpperCase(), nameUk: "1 шт", price: "100", stock: "5" }],
      }),
    );
    productId = product.id;
    variantId = (await db.productVariant.findFirstOrThrow({ where: { productId } })).id;
    await db.promoCode.create({ data: { code: promoCode, type: "PERCENTAGE", value: 10, minOrder: 10000, usageLimit: 1 } });
    const role = await db.role.findUniqueOrThrow({ where: { key: "CUSTOMER" } });
    customerId = (
      await db.user.create({ data: { email: `${RUN}@example.com`, firstName: "Test", passwordHash: await hashPassword("password123"), roleId: role.id } })
    ).id;
  });

  afterAll(async () => {
    const orderIds = (await db.order.findMany({ where: { email: { startsWith: RUN } }, select: { id: true } })).map((o) => o.id);
    await db.order.deleteMany({ where: { id: { in: orderIds } } });
    await deleteProducts([productId]);
    await db.promoCode.deleteMany({ where: { code: promoCode } });
    await db.user.deleteMany({ where: { email: `${RUN}@example.com` } });
    await db.cart.deleteMany({ where: { items: { none: {} }, userId: null } });
    await db.$disconnect();
  });

  it("creates a product with variant, inventory, translations and placeholder image", async () => {
    const p = await db.product.findUniqueOrThrow({ where: { id: productId }, include: { translations: true, images: true, variants: { include: { inventory: true } } } });
    expect(p.price).toBe(10000);
    expect(p.translations.map((t) => t.locale).sort()).toEqual(["en", "uk"]);
    expect(p.images[0].url).toMatch(/\.svg$/);
    expect(p.variants[0].inventory?.quantity).toBe(5);
  });

  it("rejects a second product with the same SKU", async () => {
    const category = await db.category.findFirstOrThrow();
    await expect(
      saveProduct(
        productInputSchema.parse({
          translations: { uk: { name: "Дубль", shortDescription: "x" }, ru: {}, en: {} },
          categoryId: category.id,
          variants: [{ sku: `${RUN}-SKU`.toUpperCase(), nameUk: "1", price: "1", stock: "0" }],
        }),
      ),
    ).rejects.toMatchObject({ code: "sku_taken" });
  });

  it("guest cart: add, clamp to stock, apply promo", async () => {
    jar.clear();
    let view = await cart.addToCart(variantId, 2, "uk");
    expect(view.count).toBe(2);
    expect(view.totals.subtotal).toBe(20000);
    view = await cart.setCartQuantity(variantId, 99, "uk");
    expect(view.lines[0].quantity).toBe(5); // clamped to stock
    await expect(cart.addToCart(variantId, 1, "uk")).rejects.toMatchObject({ code: "insufficient_stock" });
    view = await cart.setCartQuantity(variantId, 3, "uk");
    view = await cart.applyPromoCode(promoCode.toLowerCase(), "uk");
    expect(view.promo).toMatchObject({ code: promoCode, discount: 3000, error: null });
  });

  it("creates an order atomically: stock decremented, promo usage recorded, cart cleared", async () => {
    const input = checkoutSchema.parse({
      firstName: "Guest",
      lastName: "Buyer",
      phone: "0671234567",
      email: `${RUN}-guest@example.com`,
      city: "Дніпро",
      deliveryMethod: "NOVA_POSHTA_BRANCH",
      branch: "Відділення №1",
      paymentMethod: "CASH_ON_DELIVERY",
    });
    const res = await orders.createOrder(input, "uk");
    expect(res.redirectUrl).toBeNull();
    const order = await db.order.findUniqueOrThrow({ where: { id: res.orderId }, include: { items: true, promoUsage: true } });
    expect(order.subtotal).toBe(30000);
    expect(order.discount).toBe(3000);
    expect(order.deliveryFee).toBe(8000);
    expect(order.total).toBe(35000);
    expect(order.items[0]).toMatchObject({ quantity: 3, unitPrice: 10000 });
    expect(order.promoUsage).not.toBeNull();
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId } })).quantity).toBe(2);
    expect((await cart.getCartView("uk")).count).toBe(0);
    expect((await db.promoCode.findUniqueOrThrow({ where: { code: promoCode } })).usedCount).toBe(1);
  });

  it("refuses to oversell and respects the promo usage limit", async () => {
    await cart.addToCart(variantId, 2, "uk");
    await expect(cart.applyPromoCode(promoCode, "uk")).rejects.toMatchObject({ code: "promo_limit" });
    await db.inventory.update({ where: { variantId }, data: { quantity: 1 } }); // someone else bought one
    const input = checkoutSchema.parse({
      firstName: "Guest", lastName: "Two", phone: "0671234567", email: `${RUN}-guest2@example.com`, city: "Дніпро", deliveryMethod: "PICKUP_DNIPRO", paymentMethod: "CASH_ON_DELIVERY",
    });
    await expect(orders.createOrder(input, "uk")).rejects.toMatchObject({ code: "insufficient_stock" });
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId } })).quantity).toBe(1);
  });

  it("cancelling an order restores stock and frees the promo usage", async () => {
    const order = await db.order.findFirstOrThrow({ where: { email: `${RUN}-guest@example.com` } });
    await orders.changeOrderStatus(order.id, "CANCELLED");
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId } })).quantity).toBe(4);
    expect((await db.promoCode.findUniqueOrThrow({ where: { code: promoCode } })).usedCount).toBe(0);
    await expect(orders.changeOrderStatus(order.id, "NEW")).rejects.toMatchObject({ code: "invalid_transition" });
  });

  it("online payment goes through the provider and webhook status is idempotent", async () => {
    jar.clear();
    await cart.addToCart(variantId, 1, "uk");
    const res = await orders.createOrder(
      checkoutSchema.parse({ firstName: "Card", lastName: "Payer", phone: "0671234567", email: `${RUN}-card@example.com`, city: "Київ", deliveryMethod: "NOVA_POSHTA_BRANCH", branch: "1", paymentMethod: "CARD_ONLINE" }),
      "uk",
    );
    expect(res.redirectUrl).toMatch(/^\/checkout\/pay\/mock_/);
    const payment = await db.payment.findFirstOrThrow({ where: { orderId: res.orderId } });
    await orders.applyPaymentStatus(payment.providerRef!, "PAID", { test: true });
    await orders.applyPaymentStatus(payment.providerRef!, "FAILED", null); // must not downgrade
    expect((await db.order.findUniqueOrThrow({ where: { id: res.orderId } })).paymentStatus).toBe("PAID");
  });

  it("goods receipt adds stock, recalculates weighted-average cost and is snapshotted on sale", async () => {
    const { receiveStock } = await import("@/features/admin/inventory/service");
    await db.productVariant.update({ where: { id: variantId }, data: { costPrice: 6000 } });
    await db.inventory.update({ where: { variantId }, data: { quantity: 10 } });

    const r = await receiveStock({ variantId, quantity: 10, unitCost: 9000, note: "test", userName: "vitest" });
    expect(r).toMatchObject({ stockBefore: 10, stockAfter: 20, costBefore: 6000, costAfter: 7500 });
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).costPrice).toBe(7500);
    expect((await db.inventory.findUniqueOrThrow({ where: { variantId } })).quantity).toBe(20);

    // a sale after the receipt stores the new average cost in the order line
    jar.clear();
    await cart.addToCart(variantId, 1, "uk");
    const res = await orders.createOrder(
      checkoutSchema.parse({ firstName: "Cost", lastName: "Check", phone: "0671234567", email: `${RUN}-cost@example.com`, city: "Дніпро", deliveryMethod: "PICKUP_DNIPRO", paymentMethod: "CASH_ON_DELIVERY" }),
      "uk",
    );
    const item = await db.orderItem.findFirstOrThrow({ where: { orderId: res.orderId } });
    expect(item.unitCost).toBe(7500);
  });

  it("a new product with stock and cost gets an opening receipt; editing it does not add another", async () => {
    const category = await db.category.findFirstOrThrow({ where: { slug: "drinks" } });
    const input = {
      slug: `${RUN}-new-drink`,
      translations: { uk: { name: `Новий напій ${RUN}`, shortDescription: "Тест" }, ru: {}, en: {} },
      categoryId: category.id,
      variants: [{ sku: `${RUN}-NEW-1`.toUpperCase(), nameUk: "1 шт", price: "80", costPrice: "45,50", stock: "24" }],
    };
    const p = await saveProduct(productInputSchema.parse(input), "vitest");
    const v = await db.productVariant.findFirstOrThrow({ where: { productId: p.id } });
    const receipts = await db.stockReceipt.findMany({ where: { variantId: v.id } });
    expect(receipts).toHaveLength(1);
    expect(receipts[0]).toMatchObject({ quantity: 24, unitCost: 4550, stockBefore: 0, stockAfter: 24, costAfter: 4550, userName: "vitest" });
    expect(v.costPrice).toBe(4550);

    // re-saving the same product (existing variant) must not create a second opening receipt
    await saveProduct(productInputSchema.parse({ ...input, id: p.id, variants: [{ ...input.variants[0], id: v.id }] }), "vitest");
    expect(await db.stockReceipt.count({ where: { variantId: v.id } })).toBe(1);
    await deleteProducts([p.id]);
  });

  it("scanner: finds a variant by barcode (or SKU), unknown code → null, barcode can't be reused", async () => {
    const { findByCode } = await import("@/features/admin/scan/service");
    const category = await db.category.findFirstOrThrow({ where: { slug: "snacks" } });
    const code = `99${Date.now().toString().slice(-11)}`; // 13 digits, unique per run
    const base = {
      slug: `${RUN}-scan`,
      translations: { uk: { name: `Скан ${RUN}`, shortDescription: "Тест" }, ru: {}, en: {} },
      categoryId: category.id,
      variants: [{ sku: `${RUN}-SCAN-1`.toUpperCase(), barcode: code, nameUk: "1 шт", price: "50", stock: "3" }],
    };
    const p = await saveProduct(productInputSchema.parse(base), "vitest");

    const byBarcode = await findByCode(` ${code} `);
    expect(byBarcode).toMatchObject({ productId: p.id, matchedBy: "barcode", stock: 3 });
    const bySku = await findByCode(`${RUN}-scan-1`);
    expect(bySku).toMatchObject({ productId: p.id, matchedBy: "sku" });
    expect(await findByCode("0000000000000")).toBeNull();

    // another product can't take the same barcode
    await expect(
      saveProduct(productInputSchema.parse({ ...base, slug: `${RUN}-scan-2`, variants: [{ ...base.variants[0], sku: `${RUN}-SCAN-2`.toUpperCase() }] })),
    ).rejects.toMatchObject({ code: "barcode_taken" });
    await deleteProducts([p.id]);
  });

  it("admin authorization: anonymous and customers are rejected server-side", async () => {
    jar.clear();
    await expect(requirePermission("products:write")).rejects.toMatchObject({ code: "unauthorized" });
    await createSession(customerId);
    // getCurrentUser is memoized with React.cache per request; in tests each call is fresh.
    await expect(requirePermission("products:write")).rejects.toMatchObject({ code: "forbidden" });
  });
});
