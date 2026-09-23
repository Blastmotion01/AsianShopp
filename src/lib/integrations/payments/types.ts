/**
 * Payment provider abstraction. Checkout only talks to this interface, so
 * MockPaymentProvider can be replaced by LiqPay / WayForPay / Monobank / NovaPay /
 * Stripe by adding one class and registering it in ./index.ts.
 */
export type PaymentIntentInput = {
  orderId: string;
  orderNumber: string;
  amount: number; // minor units
  currency: string;
  description: string;
  customerEmail: string;
  locale: string;
  returnUrl: string; // where the customer lands after paying
  callbackUrl: string; // server-to-server webhook URL
};

export type PaymentIntentResult =
  | { type: "redirect"; url: string; providerRef: string }
  | { type: "paid"; providerRef: string }
  | { type: "failed"; reason: string };

export type PaymentWebhookResult = {
  providerRef: string;
  status: "PAID" | "FAILED" | "PENDING" | "REFUNDED";
  raw: unknown;
};

export interface PaymentProvider {
  readonly id: string;
  /** Whether the provider is a real payment processor. The UI labels non-live providers as test mode. */
  readonly live: boolean;
  createPayment(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  /** Verifies signature and parses the provider callback. Must throw on invalid signature. */
  parseWebhook(request: Request): Promise<PaymentWebhookResult>;
}
