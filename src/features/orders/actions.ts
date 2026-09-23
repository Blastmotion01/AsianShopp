"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { toActionError, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { isLocale } from "@/lib/localized";
import { getMockProvider } from "@/lib/integrations/payments";
import { checkoutSchema, type CheckoutInput } from "./schemas";
import { applyPaymentStatus, createOrder, startPayment, type CreateOrderResult } from "./service";

export async function placeOrderAction(input: CheckoutInput): Promise<ActionResult<CreateOrderResult>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    await enforceRateLimit("checkout", 10, 10 * 60_000);
    const raw = await getLocale();
    const locale = isLocale(raw) ? raw : "uk";
    return { ok: true, data: await createOrder(parsed.data, locale) };
  } catch (err) {
    return toActionError(err);
  }
}

/** Retry online payment for an unpaid order (order id is an unguessable cuid). */
export async function retryPaymentAction(fd: FormData) {
  const orderId = String(fd.get("orderId") ?? "");
  const locale = await getLocale();
  await enforceRateLimit("pay-retry", 10, 60_000);
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== "CARD_ONLINE" || order.paymentStatus === "PAID" || order.status === "CANCELLED") {
    redirect({ href: `/checkout/success/${orderId}`, locale });
    return;
  }
  const url = await startPayment(order.id);
  redirect({ href: url ?? `/checkout/success/${order.id}`, locale });
}

/**
 * MOCK ONLY: simulates the provider calling our webhook. Builds a signed payload and
 * runs it through the same parseWebhook() → applyPaymentStatus() path as a real callback.
 */
export async function simulateMockPaymentAction(fd: FormData) {
  const providerRef = String(fd.get("providerRef") ?? "");
  const outcome = fd.get("outcome") === "success" ? "PAID" : "FAILED";
  const locale = await getLocale();
  const payment = await db.payment.findUnique({ where: { providerRef } });
  if (!payment || payment.provider !== "mock") {
    redirect({ href: "/", locale });
    return;
  }
  const provider = getMockProvider();
  const body = JSON.stringify({ providerRef, status: outcome });
  const req = new Request("http://internal/api/payments/mock/webhook", {
    method: "POST",
    headers: { "x-mock-signature": provider.signPayload(body), "content-type": "application/json" },
    body,
  });
  const result = await provider.parseWebhook(req);
  await applyPaymentStatus(result.providerRef, result.status, result.raw);
  redirect({ href: `/checkout/success/${payment.orderId}`, locale });
}
