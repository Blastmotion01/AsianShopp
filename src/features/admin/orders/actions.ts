"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { toActionError, type ActionResult } from "@/lib/errors";
import { logAdminAction } from "@/features/admin/log";
import { changeOrderStatus } from "@/features/orders/service";
import { formatOrderNumber } from "@/features/orders/status";

const statusSchema = z.object({
  orderId: z.string().min(1).max(40),
  status: z.enum(["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(300).optional(),
});

export async function changeOrderStatusAction(input: z.input<typeof statusSchema>): Promise<ActionResult<{ status: string }>> {
  try {
    const user = await requirePermission("orders:write");
    const data = statusSchema.parse(input);
    const before = await db.order.findUnique({ where: { id: data.orderId }, select: { status: true, number: true } });
    const order = await changeOrderStatus(data.orderId, data.status, data.note);
    await logAdminAction(user, "order.status", "Order", order.id, { number: before ? formatOrderNumber(before.number) : undefined, from: before?.status, to: order.status });
    return { ok: true, data: { status: order.status } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function markOrderPaidAction(orderId: string): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("orders:write");
    const id = z.string().min(1).max(40).parse(orderId);
    await db.order.update({ where: { id }, data: { paymentStatus: "PAID", events: { create: { message: "Marked as paid by admin" } } } });
    await logAdminAction(user, "order.mark_paid", "Order", id);
    return { ok: true, data: null };
  } catch (err) {
    return toActionError(err);
  }
}
