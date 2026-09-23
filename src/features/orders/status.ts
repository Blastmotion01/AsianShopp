import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

/** Allowed status transitions. DELIVERED and CANCELLED are final. */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "PROCESSING", "SHIPPED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function formatOrderNumber(n: number) {
  return `AS-${10000 + n}`;
}

export function parseOrderNumber(s: string): number | null {
  const m = /^AS-(\d+)$/i.exec(s.trim());
  if (!m) return /^\d+$/.test(s.trim()) ? Number(s.trim()) - 10000 : null;
  return Number(m[1]) - 10000;
}

export const STATUS_TONE: Record<OrderStatus, "neutral" | "warning" | "success" | "error" | "NEW" | "LIMITED"> = {
  NEW: "NEW",
  CONFIRMED: "LIMITED",
  PROCESSING: "warning",
  SHIPPED: "warning",
  DELIVERED: "success",
  CANCELLED: "error",
};
