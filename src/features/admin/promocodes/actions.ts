"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { toActionError, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { toMinor } from "@/lib/money";
import { promoSchema } from "./schema";
import { logAdminAction } from "@/features/admin/log";

export async function savePromoAction(input: z.input<typeof promoSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("promocodes:write");
    const parsed = promoSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
    const { id, ...d } = parsed.data;
    const clash = await db.promoCode.findUnique({ where: { code: d.code } });
    if (clash && clash.id !== id) return { ok: false, error: "code_taken", fieldErrors: { code: "code_taken" } };
    const data = { ...d, value: d.type === "FIXED" ? toMinor(d.value) : d.value, description: d.description || null };
    const promo = id ? await db.promoCode.update({ where: { id }, data }) : await db.promoCode.create({ data });
    await logAdminAction(user, id ? "promo.update" : "promo.create", "PromoCode", promo.id, { code: promo.code });
    return { ok: true, data: { id: promo.id } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deletePromoAction(id: string): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("promocodes:write");
    const promo = await db.promoCode.delete({ where: { id: z.string().max(40).parse(id) } });
    await logAdminAction(user, "promo.delete", "PromoCode", id, { code: promo.code });
    return { ok: true, data: null };
  } catch (err) {
    return toActionError(err);
  }
}
