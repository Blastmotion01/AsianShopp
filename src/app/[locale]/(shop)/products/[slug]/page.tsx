import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, Truck, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getProductBySlug, getSimilarProducts } from "@/features/products/queries";
import { PurchasePanel } from "@/features/products/components/purchase-panel";
import { Gallery } from "@/features/products/components/gallery";
import { ProductRow } from "@/features/home/components/product-row";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { Badge } from "@/components/ui/badge";
import { Flag } from "@/components/brand/flag";
import { SpiceMeter, Stars } from "@/components/ui/misc";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/env";
import type { Locale } from "@/config/site";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(slug, locale as Locale);
  if (!p) return {};
  const title = p.seoTitle || `${p.name}${p.brand && !p.name.includes(p.brand) ? ` — ${p.brand}` : ""}`;
  const description = p.seoDescription || p.shortDescription;
  const path = `${locale === "uk" ? "" : `/${locale}`}/products/${p.slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: { uk: `/products/${p.slug}`, ru: `/ru/products/${p.slug}`, en: `/en/products/${p.slug}` },
    },
    openGraph: { title, description, url: path, type: "website" },
  };
}

const BG: Record<string, string> = { KR: "bg-pink-100", JP: "bg-cream-100", CN: "bg-coral-50", US: "bg-[#EFEAE6]" };

export default async function ProductPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const product = await getProductBySlug(slug, locale);
  if (!product) notFound();

  const t = await getTranslations("product");
  const tb = await getTranslations("badges");
  const tn = await getTranslations("nav");
  const tco = await getTranslations("checkout");
  const format = await getFormatter();

  const [similar, reviews] = await Promise.all([
    getSimilarProducts(product, locale),
    db.review.findMany({
      where: { productId: product.id, isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { firstName: true } } },
    }),
  ]);

  const size = product.volumeMl ? t("ml", { value: product.volumeMl }) : product.weightGrams ? t("grams", { value: product.weightGrams }) : null;
  const isPlaceholder = product.images.every((i) => i.url.endsWith(".svg"));
  const n = product.nutrition;
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  const productUrl = `${appUrl}${locale === "uk" ? "" : `/${locale}`}/products/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.variants[0]?.sku,
    image: product.images.map((i) => `${appUrl}${i.url}`),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    countryOfOrigin: product.country?.name,
    category: product.category.name,
    ...(product.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } } : {}),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      price: (v.price / 100).toFixed(2),
      priceCurrency: "UAH",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productUrl,
    })),
  };

  return (
    <div className="container-page pt-4 pb-10 md:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label={t("breadcrumbs")} className="mb-6 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-muted">
          <li>
            <Link href="/" className="hover:text-ink">
              {tn("home")}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li>
            <Link href="/products" className="hover:text-ink">
              {tn("catalog")}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li aria-current="page" className="font-semibold text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Gallery images={product.images} name={product.name} bgClass={BG[product.country?.code ?? ""] ?? "bg-cream-100"} isPlaceholder={isPlaceholder} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.country && (
              <Link
                href={`/products?country=${product.country.code}`}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-bold hover:bg-cream-100"
              >
                <Flag code={product.country.code} /> {product.country.name}
              </Link>
            )}
            {product.badges.map((b) => (
              <Badge key={b} variant={b}>
                {tb(b)}
              </Badge>
            ))}
          </div>
          {product.brand && <p className="mt-4 font-display text-sm font-bold tracking-widest text-muted uppercase">{product.brand}</p>}
          <h1 className="mt-1 font-display text-3xl font-extrabold md:text-5xl">{product.name}</h1>
          <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm hover:underline">
            <Stars value={product.rating} label={t("ratingStars", { value: product.rating.toFixed(1) })} />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-muted">· {t("reviewsCount", { count: product.reviewCount })}</span>
          </a>
          <p className="mt-5 text-lg text-ink-soft">{product.shortDescription}</p>

          <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-5 shadow-pop md:p-6">
            <PurchasePanel productId={product.id} variants={product.variants} />
          </div>

          <ul className="mt-5 grid gap-2 text-sm text-muted sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-coral-600" aria-hidden="true" /> {tco("methods.NOVA_POSHTA_BRANCH")} · {tco("methodHints.NOVA_POSHTA_BRANCH")}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-coral-600" aria-hidden="true" /> {tco("methods.PICKUP_DNIPRO")}
            </li>
          </ul>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: t("country"), v: product.country ? product.country.name : "—" },
              { k: product.volumeMl ? t("volume") : t("weight"), v: size ?? "—" },
              { k: t("category"), v: product.category.name },
              { k: t("spice"), v: null },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border-2 border-line bg-white p-3">
                <dt className="text-xs font-semibold text-muted">{s.k}</dt>
                <dd className="mt-1 font-bold">
                  {s.v ?? (
                    <span className="flex flex-col gap-1">
                      <SpiceMeter level={product.spiceLevel} label={t(`spiceLevels.${product.spiceLevel}` as "spiceLevels.0")} />
                      <span className="text-xs font-semibold text-muted">{t(`spiceLevels.${product.spiceLevel}` as "spiceLevels.0")}</span>
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Details */}
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        <DetailCard title={t("description")} className="lg:col-span-2">
          <p className="text-lg leading-relaxed whitespace-pre-line">{product.description}</p>
        </DetailCard>
        <DetailCard title={t("nutrition")}>
          {n ? (
            <>
              <p className="-mt-2 mb-3 text-xs text-muted">{t("nutritionPer100")}</p>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {[
                    [t("energy"), t("kcal", { value: format.number(n.energyKcal) })],
                    [t("fat"), t("g", { value: format.number(n.fat) })],
                    [t("carbs"), t("g", { value: format.number(n.carbs) })],
                    [t("sugar"), t("g", { value: format.number(n.sugar) })],
                    [t("protein"), t("g", { value: format.number(n.protein) })],
                    [t("salt"), t("g", { value: format.number(n.salt) })],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="py-2 text-left font-medium text-muted">
                        {k}
                      </th>
                      <td className="py-2 text-right font-bold">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-muted">{t("notProvided")}</p>
          )}
        </DetailCard>
        <DetailCard title={t("ingredients")} className="lg:col-span-2">
          <p>{product.ingredients || t("notProvided")}</p>
        </DetailCard>
        <DetailCard title={t("allergens")} tone="warn">
          <p className="font-semibold">{product.allergens || t("notProvided")}</p>
        </DetailCard>
      </div>

      {/* Reviews */}
      <section id="reviews" className="mt-16 scroll-mt-28" aria-labelledby="reviews-title">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id="reviews-title" className="font-display text-3xl font-extrabold md:text-4xl">
            {t("reviews")} <span className="text-muted">({product.reviewCount})</span>
          </h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {reviews.length === 0 ? (
            <p className="rounded-xl border-2 border-dashed border-line p-8 text-center text-muted">{t("noReviews")}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border-2 border-line bg-white p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="grid size-9 place-items-center rounded-full bg-pink-200 font-display text-sm" aria-hidden="true">
                        {r.user.firstName.slice(0, 1)}
                      </span>
                      {r.user.firstName}
                    </span>
                    <Stars value={r.rating} label={t("ratingStars", { value: r.rating })} />
                  </div>
                  <p className="mt-3" lang={r.locale}>
                    {r.body}
                  </p>
                  <p className="mt-3 text-xs text-muted">{format.dateTime(r.createdAt, { dateStyle: "medium" })}</p>
                </li>
              ))}
            </ul>
          )}
          <div>
            <h3 className="mb-3 font-display text-lg font-bold">{t("writeReview")}</h3>
            <ReviewForm productId={product.id} slug={product.slug} />
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-16" aria-labelledby="similar-title">
          <h2 id="similar-title" className="mb-8 font-display text-3xl font-extrabold md:text-4xl">
            {t("similar")}
          </h2>
          <ProductRow products={similar.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}

function DetailCard({ title, children, className, tone }: { title: string; children: React.ReactNode; className?: string; tone?: "warn" }) {
  return (
    <section className={`rounded-2xl border-2 p-6 ${tone === "warn" ? "border-coral-300 bg-coral-50" : "border-line bg-white"} ${className ?? ""}`}>
      <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
