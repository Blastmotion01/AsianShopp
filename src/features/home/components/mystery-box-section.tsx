import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/product/product-image";
import type { ProductCardData } from "@/features/products/types";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";
import { SectionHeader } from "./section-header";

export function MysteryBoxSection({
  title,
  subtitle,
  boxes,
  locale,
  cta,
}: {
  title: string;
  subtitle: string;
  boxes: ProductCardData[];
  locale: Locale;
  cta: string;
}) {
  return (
    <div className="grain overflow-hidden rounded-2xl border-2 border-ink bg-ink p-6 md:p-12">
      <SectionHeader title={title} subtitle={subtitle} href="/mystery-box" linkLabel={cta} tone="light" />
      <ul className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {boxes.map((b, i) => (
          <li key={b.id} className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto">
            <Link
              href={`/products/${b.slug}`}
              className={`group block rounded-xl border-2 border-cream-100/20 bg-cream-100/5 p-3 transition-all hover:-translate-y-2 hover:border-pink-300 ${i % 2 ? "md:translate-y-6" : ""}`}
            >
              <span className="relative block aspect-square overflow-hidden rounded-lg bg-cream-100/10">
                {b.image && (
                  <ProductImage src={b.image.url} alt={b.image.alt} fill sizes="(min-width:768px) 20vw, 60vw" className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
                )}
              </span>
              <span className="mt-3 block font-display font-bold text-white">{b.name}</span>
              <span className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-lg font-bold text-pink-300">{formatPrice(b.price, locale)}</span>
                {b.compareAtPrice && <s className="text-sm text-cream-100/50">{formatPrice(b.compareAtPrice, locale)}</s>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
