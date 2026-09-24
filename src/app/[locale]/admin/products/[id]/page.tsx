import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { pickLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ProductForm } from "@/features/admin/products/components/product-form";
import { normalizeBarcode } from "@/features/admin/products/schema";
import { Link } from "@/i18n/navigation";
import { ScanBarcode } from "lucide-react";
import { EMPTY_PRODUCT, type ProductFormState } from "@/features/admin/products/form-state";
import type { Locale } from "@/config/site";

const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const uah = (minor: number | null | undefined) => (minor === null || minor === undefined ? "" : String(minor / 100));
const loc = (v: unknown, l: "uk" | "ru" | "en") => (v && typeof v === "object" ? String((v as Record<string, string>)[l] ?? "") : "");

/** /admin/products/new and /admin/products/[id] share this page. */
export default async function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  /** ?barcode= (new product from the scanner) · ?scanned= (existing product found by the scanner) */
  searchParams: Promise<{ barcode?: string; scanned?: string }>;
}) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("products:write");
  const t = await getTranslations("admin.products");
  const ts = await getTranslations("admin.scan");
  const sp = await searchParams;
  const scannedNew = id === "new" ? normalizeBarcode(sp.barcode).slice(0, 64) : "";
  const scannedExisting = id !== "new" ? normalizeBarcode(sp.scanned).slice(0, 64) : "";

  const [categories, countries, brands] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.country.findMany({ orderBy: { sortOrder: "asc" } }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);

  let initial: ProductFormState = {
    ...EMPTY_PRODUCT,
    categoryId: categories[0]?.id ?? "",
    // Scanned but unknown barcode → pre-fill it (and use it as SKU if nothing better is known yet)
    variants: scannedNew ? [{ ...EMPTY_PRODUCT.variants[0], barcode: scannedNew, sku: `AS-${scannedNew}`.slice(0, 64) }] : EMPTY_PRODUCT.variants,
  };
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
        barcode: v.barcode ?? "",
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
      {(scannedNew || scannedExisting) && (
        <p role="status" className={`mb-4 flex flex-wrap items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${scannedNew ? "border-warning bg-warning-soft text-warning" : "border-success bg-success-soft text-success"}`}>
          <ScanBarcode className="size-4" aria-hidden="true" />
          {scannedNew ? ts("bannerNew", { code: scannedNew }) : ts("bannerFound", { code: scannedExisting })}
          <Link href="/admin/scan" className="ml-auto underline">
            {ts("scanNext")}
          </Link>
        </p>
      )}
      <ProductForm
        key={initial.id ?? `new-${scannedNew}`}
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, label: pickLocalized(c.name, locale) }))}
        countries={countries.map((c) => ({ id: c.id, label: pickLocalized(c.name, locale) }))}
        brands={brands.map((b) => b.name)}
      />
    </div>
  );
}
