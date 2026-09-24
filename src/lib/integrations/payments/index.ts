import "server-only";
import { env } from "@/lib/env";
import { MockPaymentProvider } from "./mock";
import type { PaymentProvider } from "./types";

export type { PaymentProvider } from "./types";

/**
 * Registry of providers. To add LiqPay:
 *   1. create ./liqpay.ts implementing PaymentProvider
 *   2. add `liqpay: () => new LiqPayProvider(...)` below
 *   3. set PAYMENT_PROVIDER=liqpay
 */
const registry: Record<string, () => PaymentProvider> = {
  mock: () => new MockPaymentProvider(env().AUTH_SECRET),
};

export function getPaymentProvider(id = env().PAYMENT_PROVIDER): PaymentProvider {
  const factory = registry[id];
  if (!factory) throw new Error(`Payment provider "${id}" is not implemented. Available: ${Object.keys(registry).join(", ")}`);
  return factory();
}

/** For UI only: whether card payments run in test mode. Never throws — a misconfigured provider must not break checkout pages. */
export function isPaymentTestMode(): boolean {
  try {
    return !getPaymentProvider().live;
  } catch (err) {
    console.error("[payments] provider misconfigured:", err instanceof Error ? err.message : err);
    return true;
  }
}

export function getMockProvider() {
  return new MockPaymentProvider(env().AUTH_SECRET);
}
