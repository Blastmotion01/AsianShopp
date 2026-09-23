import { createHmac, timingSafeEqual } from "node:crypto";
import { randomToken } from "@/lib/auth/tokens";
import type { PaymentIntentInput, PaymentIntentResult, PaymentProvider, PaymentWebhookResult } from "./types";

/**
 * MOCK provider for development. Redirects the customer to /checkout/pay/[ref],
 * a clearly-labelled test page where they can simulate success or failure.
 * That page builds a signed payload and runs it through parseWebhook() →
 * applyPaymentStatus(), the same path /api/payments/mock/webhook uses.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";
  readonly live = false;

  constructor(private secret: string) {}

  async createPayment(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const providerRef = `mock_${randomToken(12)}`;
    const params = new URLSearchParams({ order: input.orderNumber });
    return { type: "redirect", url: `/checkout/pay/${providerRef}?${params}`, providerRef };
  }

  signPayload(payload: string) {
    return createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookResult> {
    const body = await request.text();
    const signature = request.headers.get("x-mock-signature") ?? "";
    const expected = this.signPayload(body);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("invalid_signature");
    const data = JSON.parse(body) as { providerRef: string; status: "PAID" | "FAILED" };
    return { providerRef: data.providerRef, status: data.status, raw: data };
  }
}
