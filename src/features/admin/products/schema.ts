import { z } from "zod";

const optText = (max: number) => z.string().trim().max(max, "tooLong").optional().default("");
const optNum = (min: number, max: number) =>
  z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(",", "."))))
    .pipe(z.number().min(min).max(max).nullable());

const translation = z.object({
  name: optText(160),
  shortDescription: optText(300),
  description: optText(5000),
  ingredients: optText(2000),
  allergens: optText(500),
});

export const variantInputSchema = z.object({
  id: z.string().max(40).optional(),
  sku: z
    .string()
    .trim()
    .min(1, "required")
    .max(64, "tooLong")
    .regex(/^[A-Za-z0-9._-]+$/, "invalid"),
  nameUk: z.string().trim().min(1, "required").max(60, "tooLong"),
  nameRu: optText(60),
  nameEn: optText(60),
  price: optNum(0.01, 1_000_000).refine((v) => v !== null, "required"),
  compareAtPrice: optNum(0, 1_000_000),
  /** Purchase cost per unit, UAH (for profit reports) */
  costPrice: optNum(0, 1_000_000),
  weightGrams: optNum(0, 100_000),
  stock: optNum(0, 1_000_000).transform((v) => Math.floor(v ?? 0)),
});

export const productInputSchema = z
  .object({
    id: z.string().max(40).optional(),
    slug: z
      .string()
      .trim()
      .max(90, "tooLong")
      .regex(/^[a-z0-9-]*$/, "invalid")
      .optional()
      .default(""),
    translations: z.object({
      uk: translation.extend({ name: z.string().trim().min(1, "required").max(160, "tooLong"), shortDescription: z.string().trim().min(1, "required").max(300, "tooLong") }),
      ru: translation,
      en: translation,
    }),
    categoryId: z.string().min(1, "required").max(40),
    countryId: z.string().max(40).optional().default(""),
    brandName: optText(80),
    volumeMl: optNum(0, 100_000),
    spiceLevel: z.coerce.number().int().min(0).max(5).default(0),
    tags: z
      .string()
      .optional()
      .default("")
      .transform((s) =>
        [...new Set(s.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].filter((t) => /^[a-z0-9-]{1,30}$/.test(t)).slice(0, 20),
      ),
    isNew: z.boolean().default(false),
    isPopular: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    isLimited: z.boolean().default(false),
    isActive: z.boolean().default(true),
    images: z
      .array(z.object({ url: z.string().trim().min(1).max(500).refine((u) => u.startsWith("/") || u.startsWith("https://"), "invalid"), alt: optText(200) }))
      .max(12)
      .default([]),
    variants: z.array(variantInputSchema).min(1, "required").max(20),
    nutrition: z
      .object({
        energyKcal: optNum(0, 10000),
        fat: optNum(0, 100),
        carbs: optNum(0, 100),
        sugar: optNum(0, 100),
        protein: optNum(0, 100),
        salt: optNum(0, 100),
      })
      .optional(),
    seoTitle: z.object({ uk: optText(160), ru: optText(160), en: optText(160) }).default({ uk: "", ru: "", en: "" }),
    seoDescription: z.object({ uk: optText(300), ru: optText(300), en: optText(300) }).default({ uk: "", ru: "", en: "" }),
  })
  .superRefine((v, ctx) => {
    const skus = v.variants.map((x) => x.sku.toUpperCase());
    skus.forEach((s, i) => {
      if (skus.indexOf(s) !== i) ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "sku_taken" });
    });
  });

export type ProductInput = z.input<typeof productInputSchema>;
export type ProductData = z.output<typeof productInputSchema>;

/** Nutrition is stored only when at least one value was entered. */
export function normalizeNutrition(n: ProductData["nutrition"]) {
  if (!n) return null;
  const entries = Object.entries(n).filter(([, v]) => v !== null);
  return entries.length ? (Object.fromEntries(entries.map(([k, v]) => [k, v as number])) as Record<string, number>) : null;
}
