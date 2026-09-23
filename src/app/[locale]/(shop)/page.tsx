import { getTranslations, setRequestLocale } from "next-intl/server";
import { Truck, BadgeCheck, Sparkles, MapPin } from "lucide-react";
import { getHomeBlocks } from "@/features/cms/queries";
import type { BannerData, HeroData, SectionData } from "@/features/cms/blocks";
import { getCategories, getCountries, listProductsWhere } from "@/features/products/queries";
import { Hero } from "@/features/home/components/hero";
import { CountryCards } from "@/features/home/components/country-cards";
import { CategoryBento, type CategoryTile } from "@/features/home/components/category-bento";
import { ProductRow } from "@/features/home/components/product-row";
import { SectionHeader } from "@/features/home/components/section-header";
import { SnackMatchTeaser } from "@/features/home/components/snack-match-teaser";
import { MysteryBoxSection } from "@/features/home/components/mystery-box-section";
import { PromoBanner } from "@/features/home/components/promo-banner";
import { Reveal } from "@/components/motion/reveal";
import { pickLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

export const revalidate = 300;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const tsm = await getTranslations("snackMatch.questions");

  const [blocks, countries, categories, featured, fresh, spicy, boxes] = await Promise.all([
    getHomeBlocks(),
    getCountries(),
    getCategories(),
    listProductsWhere({ isFeatured: true, category: { slug: { not: "mystery-box" } } }, locale, 8),
    listProductsWhere({ isNew: true }, locale, 4, "newest"),
    listProductsWhere({ spiceLevel: { gte: 3 } }, locale, 4, "popular"),
    listProductsWhere({ category: { slug: "mystery-box" } }, locale, 5, "priceAsc"),
  ]);

  const L = (v: unknown) => pickLocalized(v, locale);

  const render = (key: string, data: unknown) => {
    switch (key) {
      case "hero": {
        const d = data as HeroData;
        const floating = [...featured].filter((p) => p.image).slice(0, 3);
        return (
          <Hero
            eyebrow={L(d.eyebrow)}
            title={L(d.title)}
            highlight={L(d.highlight)}
            subtitle={L(d.subtitle)}
            ctaLabel={L(d.ctaLabel)}
            ctaHref={d.ctaHref}
            secondaryLabel={L(d.secondaryLabel)}
            secondaryHref={d.secondaryHref}
            stickers={{ new: t("stickerNew"), import: t("stickerImport"), spicy: t("stickerSpicy") }}
            products={floating.map((p) => ({ slug: p.slug, name: p.name, image: p.image?.url ?? null, price: formatPrice(p.price, locale), countryCode: p.country?.code ?? null }))}
          />
        );
      }
      case "countries": {
        const d = data as SectionData;
        return (
          <Section>
            <Reveal>
              <SectionHeader title={L(d.title)} subtitle={L(d.subtitle)} />
            </Reveal>
            <CountryCards
              exploreLabel={t("explore")}
              countries={countries.map((c) => ({
                code: c.code,
                name: L(c.nameRaw),
                tagline: L(c.taglineRaw),
                flag: c.flag,
                count: t("productsCount", { count: c.count }),
              }))}
            />
          </Section>
        );
      }
      case "featured": {
        const d = data as SectionData;
        if (!featured.length) return null;
        return (
          <Section>
            <Reveal>
              <SectionHeader title={L(d.title)} subtitle={L(d.subtitle)} href="/products?popular=1" linkLabel={tc("seeAll")} />
            </Reveal>
            <ProductRow products={featured} />
          </Section>
        );
      }
      case "categories": {
        const d = data as SectionData;
        const tiles: CategoryTile[] = categories
          .filter((c) => c.showOnHome && c.slug !== "mystery-box")
          .map((c) => ({
            href: `/products?category=${c.slug}`,
            name: L(c.nameRaw),
            emoji: c.emoji ?? "🍬",
            color: c.color,
            count: t("productsCount", { count: c.count }),
            description: L(c.descriptionRaw),
          }));
        tiles.splice(5, 0, { href: "/products?new=1", name: t("newTile"), emoji: "✨", color: "#FFFFFF", count: undefined, description: t("newTileText") });
        return (
          <Section>
            <Reveal>
              <SectionHeader title={L(d.title)} subtitle={L(d.subtitle)} href="/products" linkLabel={t("viewAll")} />
            </Reveal>
            <CategoryBento tiles={tiles} />
          </Section>
        );
      }
      case "snackMatch": {
        const d = data as SectionData;
        return (
          <Section>
            <Reveal>
              <SnackMatchTeaser
                title={L(d.title)}
                subtitle={L(d.subtitle)}
                cta={t("snackMatchCta")}
                questions={[tsm("sweet.q"), tsm("spicy.q"), tsm("format.q"), tsm("unusual.q")]}
              />
            </Reveal>
          </Section>
        );
      }
      case "newArrivals": {
        const d = data as SectionData;
        if (!fresh.length) return null;
        return (
          <Section>
            <Reveal>
              <SectionHeader title={L(d.title)} subtitle={L(d.subtitle)} href="/products?sort=newest" linkLabel={tc("seeAll")} />
            </Reveal>
            <ProductRow products={fresh} />
          </Section>
        );
      }
      case "mysteryBox": {
        const d = data as SectionData;
        if (!boxes.length) return null;
        return (
          <Section>
            <Reveal>
              <MysteryBoxSection title={L(d.title)} subtitle={L(d.subtitle)} boxes={boxes} locale={locale} cta={t("mysteryCta")} />
            </Reveal>
          </Section>
        );
      }
      case "promoBanner": {
        const d = data as BannerData;
        return (
          <Section>
            <Reveal>
              <PromoBanner
                title={L(d.title)}
                text={L(d.text)}
                code={d.code}
                ctaLabel={L(d.ctaLabel)}
                ctaHref={d.ctaHref}
                copyLabel={t("promoCopy")}
                copiedLabel={tc("copied")}
              />
            </Reveal>
          </Section>
        );
      }
      case "spicy": {
        const d = data as SectionData;
        if (!spicy.length) return null;
        return (
          <Section>
            <Reveal>
              <SectionHeader title={L(d.title)} subtitle={L(d.subtitle)} href="/products?category=spicy" linkLabel={tc("seeAll")} />
            </Reveal>
            <ProductRow products={spicy} />
          </Section>
        );
      }
      case "benefits": {
        const d = data as SectionData;
        const items = [
          { icon: <MapPin />, title: t("benefitFast"), text: t("benefitFastText"), bg: "bg-pink-300" },
          { icon: <BadgeCheck />, title: t("benefitOriginal"), text: t("benefitOriginalText"), bg: "bg-cream-200" },
          { icon: <Sparkles />, title: t("benefitDiscovery"), text: t("benefitDiscoveryText"), bg: "bg-coral-500" },
          { icon: <Truck />, title: t("benefitUkraine"), text: t("benefitUkraineText"), bg: "bg-white" },
        ];
        return (
          <Section>
            <Reveal>
              <h2 className="sr-only">{L(d.title)}</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((b) => (
                  <li key={b.title} className="flex gap-4 rounded-xl border-2 border-ink bg-white p-5">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink ${b.bg} [&_svg]:size-5`} aria-hidden="true">
                      {b.icon}
                    </span>
                    <span>
                      <span className="block font-display font-bold">{b.title}</span>
                      <span className="mt-1 block text-sm text-muted">{b.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </Section>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
      {blocks
        .filter((b) => b.isActive && b.key !== "announcement")
        .map((b) => (
          <div key={b.key}>{render(b.key, b.data)}</div>
        ))}
    </>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="container-page py-10 md:py-16">{children}</section>;
}
