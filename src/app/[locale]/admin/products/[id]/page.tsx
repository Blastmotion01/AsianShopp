import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { pickLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ProductForm } from "@/features/admin/products/components/product-form";
import { EMPTY_PRODUCT, type ProductFormState } from "@/features/admin/products/form-state";
import type { Locale } from "@/config/site";

const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const uah = (minor: number | null | undefined) => (minor === null || minor === undefined ? "" : String(minor / 100));
const loc = (v: unknown, l: "uk" | "ru" | "en") => (v && typeof v === "object" ? String((v as Record<string, string>)[l] ?? "") : "");

/** /admin/products/new and /admin/products/[id] share this page. */
export default async function AdminProductEditPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("products:write");
  const t = await getTranslations("admin.products");

  const [categories, countries, brands] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.country.findMany({ orderBy: { sortOrder: "asc" } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  let initial: ProductFormState = { ...EMPTY_PRODUCT, categoryId: categories[0]?.id ?? "" };
  if (id !== "new") {
    const p = await db.product.findUnique({
      where: { id },
      include: { translations: true, images: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" }, include: { inventory: true } }, brand: true },
    });
    if (!p) notFound();
    const tr = (l: "uk" | "ru" | "en") => {
      const x = p.translations.find((r) => r.locale === l);
      return { name: x?.name ?? "", shortDescription: x?.shortDescription ?? "", description: x?.description ?? "", ingredients: x?.ingredients ?? "", allergens: x?.allergens ?? "" };
    };
    const n = (p.nutrition ?? {}) as Record<string, number>;
    initial = {
      id: p.id,
      slug: p.slug,
      translations: { uk: tr("uk"), ru: tr("ru"), en: tr("en") },
      categoryId: p.categoryId,
      countryId: p.countryId ?? "",
      brandName: p.brand?.name ?? "",
      volumeMl: str(p.volumeMl),
      spiceLevel: p.spiceLevel,
      tags: p.tags.join(", "),
      isNew: p.isNew,
      isPopular: p.isPopular,
      isFeatured: p.isFeatured,
      isLimited: p.isLimited,
      isActive: p.isActive,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        nameUk: loc(v.name, "uk"),
        nameRu: loc(v.name, "ru"),
        nameEn: loc(v.name, "en"),
        price: uah(v.price),
        compareAtPrice: uah(v.compareAtPrice),
        costPrice: uah(v.costPrice),
        weightGrams: str(v.weightGrams),
        stock: str(v.inventory?.quantity ?? 0),
      })),
      nutrition: { energyKcal: str(n.energyKcal), fat: str(n.fat), carbs: str(n.carbs), sugar: str(n.sugar), protein: str(n.protein), salt: str(n.salt) },
      seoTitle: { uk: loc(p.seoTitle, "uk"), ru: loc(p.seoTitle, "ru"), en: loc(p.seoTitle, "en") },
      seoDescription: { uk: loc(p.seoDescription, "uk"), ru: loc(p.seoDescription, "ru"), en: loc(p.seoDescription, "en") },
    };
  }

  return (
    <div>
      <AdminPageHeader title={id === "new" ? t("new") : `${t("edit")}: ${initial.translations.uk.name}`} />
      <ProductForm
        key={initial.id ?? "new"}
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, label: pickLocalized(c.name, locale) }))}
        countries={countries.map((c) => ({ id: c.id, label: pickLocalized(c.name, locale) }))}
        brands={brands.map((b) => b.name)}
      />
    </div>
  );
}
