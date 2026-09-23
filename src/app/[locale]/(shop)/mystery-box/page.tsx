import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { listProductsWhere } from "@/features/products/queries";
import { ProductCard } from "@/features/products/components/product-card";
import type { Locale } from "@/config/site";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "mysteryBox" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function MysteryBoxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("mysteryBox");
  const boxes = await listProductsWhere({ category: { slug: "mystery-box" } }, locale, 20, "priceAsc");
  const steps = [
    { n: "01", title: t("step1"), text: t("step1Text"), bg: "bg-pink-300" },
    { n: "02", title: t("step2"), text: t("step2Text"), bg: "bg-cream-200" },
    { n: "03", title: t("step3"), text: t("step3Text"), bg: "bg-coral-500" },
  ];

  return (
    <div className="container-page pt-6 pb-10 md:pt-10">
      <section className="grain relative overflow-hidden rounded-2xl border-2 border-ink bg-ink px-6 py-14 text-center md:py-24">
        <div aria-hidden="true" className="mb-6 text-7xl md:text-8xl">
          <span className="inline-block animate-float">🎁</span>
        </div>
        <h1 className="font-display text-5xl font-extrabold text-white md:text-7xl">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-cream-100/80 md:text-xl">{t("subtitle")}</p>
      </section>

      <section className="mt-12" aria-labelledby="how">
        <h2 id="how" className="mb-6 font-display text-3xl font-extrabold">
          {t("how")}
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className={`rounded-2xl border-2 border-ink p-6 ${s.bg}`}>
              <span className="font-display text-4xl font-extrabold">{s.n}</span>
              <p className="mt-3 font-display text-xl font-bold">{s.title}</p>
              <p className="mt-1 font-medium text-ink/80">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
        {boxes.map((b) => (
          <li key={b.id}>
            <ProductCard product={b} />
          </li>
        ))}
      </ul>
    </div>
  );
}
