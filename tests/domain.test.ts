import { describe, expect, it } from "vitest";
import { canTransition, formatOrderNumber, parseOrderNumber } from "@/features/orders/status";
import { checkoutSchema, normalizePhone } from "@/features/orders/schemas";
import { productInputSchema } from "@/features/admin/products/schema";
import { scoreProduct, rankProducts, type Answers } from "@/features/snack-match/matcher";
import { computeBadges } from "@/features/products/badges";
import { parseCatalogFilters } from "@/features/products/filters";

describe("orders", () => {
  it("allows forward transitions and forbids leaving final states", () => {
    expect(canTransition("NEW", "CONFIRMED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "NEW")).toBe(false);
    expect(canTransition("SHIPPED", "NEW")).toBe(false);
  });

  it("formats and parses order numbers", () => {
    expect(formatOrderNumber(49)).toBe("AS-10049");
    expect(parseOrderNumber("as-10049")).toBe(49);
    expect(parseOrderNumber("10049")).toBe(49);
  });

  it("normalizes Ukrainian phone numbers", () => {
    expect(normalizePhone("067 123 45 67")).toBe("+380671234567");
    expect(normalizePhone("+38 (067) 123-45-67")).toBe("+380671234567");
  });

  it("validates checkout: branch required for Nova Poshta, Dnipro-only methods force the city", () => {
    const base = { firstName: "A", lastName: "B", phone: "0671234567", email: "a@b.co", city: "Київ", paymentMethod: "CASH_ON_DELIVERY" as const };
    const noBranch = checkoutSchema.safeParse({ ...base, deliveryMethod: "NOVA_POSHTA_BRANCH" });
    expect(noBranch.success).toBe(false);
    const pickup = checkoutSchema.parse({ ...base, deliveryMethod: "PICKUP_DNIPRO", branch: "ignored" });
    expect(pickup.city).toBe("Дніпро");
    expect(pickup.branch).toBe("");
  });
});

describe("product creation input", () => {
  const valid = {
    translations: { uk: { name: "Тест", shortDescription: "Опис" }, ru: {}, en: {} },
    categoryId: "cat1",
    variants: [{ sku: "SKU-1", nameUk: "1 шт", price: "99.50", stock: "10" }],
  };

  it("accepts a minimal valid product and coerces numbers", () => {
    const r = productInputSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.variants[0].price).toBe(99.5);
      expect(r.data.variants[0].stock).toBe(10);
      expect(r.data.isActive).toBe(true);
    }
  });

  it("requires a Ukrainian name, a category and at least one variant", () => {
    expect(productInputSchema.safeParse({ ...valid, translations: { uk: { name: "", shortDescription: "x" }, ru: {}, en: {} } }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...valid, variants: [] }).success).toBe(false);
  });

  it("rejects duplicate SKUs and invalid slugs", () => {
    const dup = productInputSchema.safeParse({ ...valid, variants: [valid.variants[0], { ...valid.variants[0] }] });
    expect(dup.success).toBe(false);
    expect(productInputSchema.safeParse({ ...valid, slug: "Bad Slug!" }).success).toBe(false);
  });

  it("cleans tags", () => {
    const r = productInputSchema.parse({ ...valid, tags: "Sweet, spicy ,,sweet, <script>" });
    expect(r.tags).toEqual(["sweet", "spicy"]);
  });
});

describe("catalog", () => {
  it("parses filters defensively", () => {
    const f = parseCatalogFilters({ country: "KR,JP", minPrice: "abc", sort: "hack", page: "-3", inStock: "1" });
    expect(f.country).toEqual(["KR", "JP"]);
    expect(f.minPrice).toBeUndefined();
    expect(f.sort).toBe("recommended");
    expect(f.page).toBe(1);
    expect(f.inStock).toBe(true);
  });

  it("computes badges", () => {
    expect(computeBadges({ isNew: true, isPopular: true, isLimited: false, spiceLevel: 4, price: 100, compareAtPrice: 150 })).toEqual(["SALE", "NEW", "BESTSELLER", "HOT"]);
  });
});

describe("snack match", () => {
  const fire: Answers = { sweet: "no", spicy: "fire", format: "snack", unusual: "yes", adventure: "3" };
  const sweetDrink: Answers = { sweet: "love", spicy: "no", format: "drink", unusual: "classic", adventure: "1" };
  const buldak = { id: "a", tags: ["spicy", "extreme", "unusual"], spiceLevel: 5, categorySlug: "spicy", stock: 5 };
  const bananaMilk = { id: "b", tags: ["sweet", "drink", "milky", "classic"], spiceLevel: 0, categorySlug: "drinks", stock: 5 };

  it("ranks spicy products first for heat lovers and sweet drinks for sweet tooths", () => {
    expect(scoreProduct(buldak, fire)).toBeGreaterThan(scoreProduct(bananaMilk, fire));
    expect(scoreProduct(bananaMilk, sweetDrink)).toBeGreaterThan(scoreProduct(buldak, sweetDrink));
  });

  it("excludes out-of-stock and non-matching products", () => {
    expect(rankProducts([{ ...buldak, stock: 0 }, bananaMilk], fire)).toEqual([]);
  });
});
