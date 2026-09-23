import { z } from "zod";

export const SORTS = ["recommended", "popular", "newest", "priceAsc", "priceDesc", "rating"] as const;
export type SortKey = (typeof SORTS)[number];

const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean).slice(0, 20));

const flag = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => (Array.isArray(v) ? v[0] : v) === "1");

const num = (min: number, max: number) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const s = Array.isArray(v) ? v[0] : v;
      if (s === undefined || s === "") return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
    });

/** Catalog filters parsed from URL search params. Invalid values are dropped, never thrown. */
export const catalogFiltersSchema = z.object({
  q: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 80) || undefined),
  country: list,
  category: list,
  brand: list,
  minPrice: num(0, 100000),
  maxPrice: num(0, 100000),
  inStock: flag,
  spice: num(0, 5),
  rating: num(0, 5),
  new: flag,
  popular: flag,
  limited: flag,
  sale: flag,
  sort: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const s = Array.isArray(v) ? v[0] : v;
      return (SORTS as readonly string[]).includes(s ?? "") ? (s as SortKey) : "recommended";
    }),
  page: num(1, 1000).transform((v) => Math.floor(v ?? 1)),
});

export type CatalogFilters = z.output<typeof catalogFiltersSchema>;

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  return catalogFiltersSchema.parse(params);
}

export function countActiveFilters(f: CatalogFilters) {
  return (
    f.country.length +
    f.category.length +
    f.brand.length +
    (f.minPrice !== undefined ? 1 : 0) +
    (f.maxPrice !== undefined ? 1 : 0) +
    (f.inStock ? 1 : 0) +
    (f.spice !== undefined ? 1 : 0) +
    (f.rating !== undefined ? 1 : 0) +
    (f.new ? 1 : 0) +
    (f.popular ? 1 : 0) +
    (f.limited ? 1 : 0) +
    (f.sale ? 1 : 0)
  );
}
