import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { DEFAULT_BLOCK_DATA, DEFAULT_SETTINGS, HOME_BLOCKS, blockSchemas, type StoreSettings } from "./blocks";

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    freeShippingEnabled: typeof map.freeShippingEnabled === "boolean" ? map.freeShippingEnabled : DEFAULT_SETTINGS.freeShippingEnabled,
    freeShippingThreshold:
      typeof map.freeShippingThreshold === "number" ? map.freeShippingThreshold : DEFAULT_SETTINGS.freeShippingThreshold,
  };
});

export async function freeShippingThreshold() {
  const s = await getStoreSettings();
  return s.freeShippingEnabled ? s.freeShippingThreshold : null;
}

export type HomeBlock = { key: string; type: string; data: unknown; isActive: boolean; sortOrder: number };

/** Homepage blocks in admin-defined order. Invalid stored data falls back to defaults. */
export const getHomeBlocks = cache(async (): Promise<HomeBlock[]> => {
  const rows = await db.contentBlock.findMany({ orderBy: { sortOrder: "asc" } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const blocks = HOME_BLOCKS.map((def, i) => {
    const row = byKey.get(def.key);
    const schema = blockSchemas[def.type];
    const parsed = schema.safeParse(row?.data);
    return {
      key: def.key,
      type: def.type,
      data: parsed.success ? parsed.data : DEFAULT_BLOCK_DATA[def.key],
      isActive: row?.isActive ?? true,
      sortOrder: row?.sortOrder ?? i,
    };
  });
  return blocks.sort((a, b) => a.sortOrder - b.sortOrder);
});
