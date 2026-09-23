import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { pickLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ListToolbar } from "@/features/admin/components/list-toolbar";
import { ProductsTable } from "@/features/admin/products/components/products-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/config/site";

const PAGE = 20;

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("products:write");
  const sp = await searchParams;
  const t = await getTranslations("admin.products");
  const ta = await getTranslations("admin");
  const tf = await getTranslations("admin.form");
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim().slice(0, 80);

  const where: Prisma.ProductWhereInput = {
    ...(sp.status === "active" ? { isActive: true } : sp.status === "inactive" ? { isActive: false } : {}),
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(q
      ? {
          OR: [
            { slug: { contains: q.toLowerCase() } },
            { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        translations: { where: { locale: { in: [locale, "uk"] } } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: true,
        country: true,
        variants: { include: { inventory: true } },
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));

  const rows = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: (p.translations.find((x) => x.locale === locale) ?? p.translations[0])?.name ?? p.slug,
    image: p.images[0]?.url ?? null,
    category: pickLocalized(p.category.name, locale),
    country: p.country ? pickLocalized(p.country.name, locale) : null,
    price: p.price,
    stock: p.variants.reduce((s, v) => s + (v.inventory?.quantity ?? 0), 0),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    skus: p.variants.map((v) => v.sku).join(", "),
  }));

  const current = { q: sp.q, status: sp.status, category: sp.category };
  const hrefFor = (n: number) => {
    const u = new URLSearchParams(Object.entries(current).filter(([, v]) => v) as [string, string][]);
    if (n > 1) u.set("page", String(n));
    return `/admin/products${u.toString() ? `?${u}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={String(total)}
        actions={
          <Button asChild variant="accent">
            <Link href="/admin/products/new">
              <Plus aria-hidden="true" /> {t("new")}
            </Link>
          </Button>
        }
      />
      <ListToolbar
        current={current}
        placeholder={t("searchPlaceholder")}
        selects={[
          {
            name: "status",
            label: t("status"),
            options: [
              { value: "", label: t("filterAll") },
              { value: "active", label: t("filterActive") },
              { value: "inactive", label: t("filterInactive") },
            ],
          },
          {
            name: "category",
            label: tf("category"),
            options: [{ value: "", label: t("filterAll") }, ...categories.map((c) => ({ value: c.id, label: pickLocalized(c.name, locale) }))],
          },
        ]}
      />
      {rows.length === 0 ? <EmptyState emoji="📦" title={t("noProducts")} /> : <ProductsTable rows={rows} />}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={hrefFor}
        labels={{ prev: "←", next: "→", nav: t("title"), page: (p) => ta("pagination", { page: p, total: pageCount }) }}
      />
    </div>
  );
}
