"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { toActionError, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { revalidateStorefront } from "@/lib/revalidate";
import { toMinor } from "@/lib/money";
import { blockSchemas, HOME_BLOCKS } from "@/features/cms/blocks";
import { logAdminAction } from "@/features/admin/log";

export async function saveBlockAction(input: { key: string; data: unknown; isActive: boolean }): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("cms:write");
    const def = HOME_BLOCKS.find((b) => b.key === input.key);
    if (!def) return { ok: false, error: "not_found" };
    const parsed = blockSchemas[def.type].safeParse(input.data);
    if (!parsed.success) return { ok: false, error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
    const sortOrder = HOME_BLOCKS.indexOf(def);
    await db.contentBlock.upsert({
      where: { key: def.key },
      update: { data: parsed.data, isActive: !!input.isActive },
      create: { key: def.key, type: def.type, data: parsed.data, isActive: !!input.isActive, sortOrder },
    });
    await logAdminAction(user, "cms.block_update", "ContentBlock", def.key, { isActive: !!input.isActive });
    revalidateStorefront();
    return { ok: true, data: null };
  } catch (err) {
    return toActionError(err);
  }
}

/** Persists a full ordering of homepage blocks. */
export async function reorderBlocksAction(keys: string[]): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("cms:write");
    const valid = z.array(z.string()).parse(keys).filter((k) => HOME_BLOCKS.some((b) => b.key === k));
    await db.$transaction(valid.map((key, i) => db.contentBlock.updateMany({ where: { key }, data: { sortOrder: i } })));
    await logAdminAction(user, "cms.reorder", "ContentBlock", null, { keys: valid });
    revalidateStorefront();
    return { ok: true, data: null };
  } catch (err) {
    return toActionError(err);
  }
}

const settingsSchema = z.object({
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.coerce.number().min(0).max(1_000_000),
});

export async function saveSettingsAction(input: z.input<typeof settingsSchema>): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("cms:write");
    const s = settingsSchema.parse(input);
    const threshold = toMinor(s.freeShippingThreshold);
    await db.$transaction([
      db.setting.upsert({ where: { key: "freeShippingEnabled" }, update: { value: s.freeShippingEnabled }, create: { key: "freeShippingEnabled", value: s.freeShippingEnabled } }),
      db.setting.upsert({ where: { key: "freeShippingThreshold" }, update: { value: threshold }, create: { key: "freeShippingThreshold", value: threshold } }),
    ]);
    await logAdminAction(user, "settings.update", "Setting", null, { freeShippingEnabled: s.freeShippingEnabled, freeShippingThreshold: threshold });
    revalidateStorefront();
    return { ok: true, data: null };
  } catch (err) {
    return toActionError(err);
  }
}

export async function saveCategoryHomeAction(input: { id: string; showOnHome: boolean; sortOrder: number }[]): Promise<ActionResult<null>> {
  try {
    const user = await requirePermission("cms:write");
    const rows = z.array(z.object({ id: z.string().max(40), showOnHome: z.boolean(), sortOrder: z.number().int().min(0).max(1000) })).parse(input);
    await db.$transaction(rows.map((r) => db.category.update({ where: { id: r.id }, data: { showOnHome: r.showOnHome, sortOrder: r.sortOrder } })));
    await logAdminAction(user, "cms.categories", "Category", null, { count: rows.length });
    revalidateStorefront();
    return { ok: true, data: null };
  } catch (err) {
    return toActionError(err);
  }
}
