import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { parseCatalogFilters, countActiveFilters } from "@/features/products/filters";
import { getBrands, getCategories, getCountries, getPriceBounds, listProducts } from "@/features/products/queries";
import { ProductCard } from "@/features/products/components/product-card";
import { CatalogFilters, SortSelect, type CatalogState } from "@/features/products/components/catalog-controls";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Flag } from "@/components/brand/flag";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/localized";
import type { Locale } from "@/config/site";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const f = parseCatalogFilters(await searchParams);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const title = f.q ? t("searchFor", { q: f.q }) : t("title");
  return {
    title,
    alternates: { canonical: "/products" },
    // Filtered/search variations shouldn't compete with the main catalog in search engines.
    robots: f.q || countActiveFilters(f) > 1 || f.page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filters = parseCatalogFilters(sp);
  const t = await getTranslations("catalog");

  const [result, countries, categories, brands, price] = await Promise.all([
    listProducts(filters, locale),
    getCountries(),
    getCategories(),
    getBrands(),
    getPriceBounds(),
  ]);

  const oneCountry = filters.country.length === 1 ? countries.find((c) => c.code === filters.country[0].toUpperCase()) : undefined;
  const oneCategory = filters.category.length === 1 ? categories.find((c) => c.slug === filters.category[0]) : undefined;
  const heading = filters.q
    ? t("searchFor", { q: filters.q })
    : oneCountry
      ? pickLocalized(oneCountry.nameRaw, locale)
      : oneCategory
        ? `${oneCategory.emoji ?? ""} ${pickLocalized(oneCategory.nameRaw, locale)}`
        : t("title");
  const sub = oneCountry ? pickLocalized(oneCountry.taglineRaw, locale) : oneCategory ? pickLocalized(oneCategory.descriptionRaw, locale) : "";

  const state: CatalogState = {
    q: filters.q,
    country: filters.country.map((c) => c.toUpperCase()),
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    inStock: filters.inStock,
    spice: filters.spice,
    rating: filters.rating,
    new: filters.new,
    popular: filters.popular,
    limited: filters.limited,
    sale: filters.sale,
    sort: filters.sort,
  };
  const activeCount = countActiveFilters(filters);

  const hrefFor = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === "page" || v === undefined) continue;
      p.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    if (page > 1) p.set("page", String(page));
    const qs = p.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="container-page pt-6 pb-10 md:pt-10">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold md:text-6xl">
          {oneCountry && !filters.q && <Flag code={oneCountry.code} className="mr-3 rounded-md" />}
          {heading}
        </h1>
        {sub && <p className="mt-3 max-w-2xl text-lg text-muted">{sub}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <CatalogFilters
          state={state}
          activeCount={activeCount}
          total={result.total}
          facets={{
            countries: countries.map((c) => ({ value: c.code, label: pickLocalized(c.nameRaw, locale), count: c.count, countryCode: c.code })),
            categories: categories.map((c) => ({ value: c.slug, label: pickLocalized(c.nameRaw, locale), count: c.count, emoji: c.emoji ?? "" })),
            brands: brands.filter((b) => b._count.products > 0).map((b) => ({ value: b.slug, label: b.name, count: b._count.products })),
            price,
          }}
        />

        <section aria-label={t("title")}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="font-semibold text-muted" aria-live="polite">
              {t("results", { count: result.total })}
            </p>
            <SortSelect state={state} />
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title={t("noResults")}
              text={t("noResultsText")}
              action={
                <Button asChild variant="outline">
                  <Link href="/products">{t("clearFilters")}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
              {result.items.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} priority={i < 3} />
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefFor={hrefFor}
            labels={{ prev: t("prev"), next: t("next"), nav: t("pagination"), page: (p) => t("page", { page: p, total: result.pageCount }) }}
          />
        </section>
      </div>
    </div>
  );
}
