import type { DeliveryMethod } from "@prisma/client";

/**
 * Delivery abstraction. Fees and branch lookup live behind this interface so
 * Nova Poshta / Ukrposhta / Meest API integrations can replace the static rules
 * (e.g. real branch search, cost calculation, TTN creation) without touching checkout.
 */
export interface DeliveryProvider {
  readonly id: string;
  methods: DeliveryMethod[];
  /** Fee in minor units for a given subtotal (after discount). */
  quote(method: DeliveryMethod, subtotal: number, freeFrom: number | null): number;
  /** Search branches for a city. Static provider returns [] → customer types branch manually. */
  searchBranches(city: string, query: string): Promise<{ id: string; label: string }[]>;
}

export const DELIVERY_METHODS: DeliveryMethod[] = [
  "NOVA_POSHTA_BRANCH",
  "NOVA_POSHTA_COURIER",
  "COURIER_DNIPRO",
  "PICKUP_DNIPRO",
];

/** Base fees in minor units. Pickup is always free. */
export const BASE_FEES: Record<DeliveryMethod, number> = {
  NOVA_POSHTA_BRANCH: 8000,
  NOVA_POSHTA_COURIER: 12000,
  COURIER_DNIPRO: 9000,
  PICKUP_DNIPRO: 0,
};

/** Methods that require a branch number vs. a street address. */
export const NEEDS_BRANCH: DeliveryMethod[] = ["NOVA_POSHTA_BRANCH"];
export const NEEDS_ADDRESS: DeliveryMethod[] = ["NOVA_POSHTA_COURIER", "COURIER_DNIPRO"];
/** Dnipro-only methods */
export const DNIPRO_ONLY: DeliveryMethod[] = ["COURIER_DNIPRO", "PICKUP_DNIPRO"];

export class StaticDeliveryProvider implements DeliveryProvider {
  readonly id = "static";
  methods = DELIVERY_METHODS;

  quote(method: DeliveryMethod, subtotal: number, freeFrom: number | null) {
    if (method === "PICKUP_DNIPRO") return 0;
    if (freeFrom !== null && subtotal >= freeFrom) return 0;
    return BASE_FEES[method];
  }

  async searchBranches() {
    return [];
  }
}

export const deliveryProvider: DeliveryProvider = new StaticDeliveryProvider();
