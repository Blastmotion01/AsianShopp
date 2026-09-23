"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Info, Plus, RotateCcw, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { SpiceMeter, Stars } from "@/components/ui/misc";
import { ProductImage } from "@/components/product/product-image";
import { Flag } from "@/components/brand/flag";
import { useStore } from "@/features/store/store-provider";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/site";
import type { ProductCardData } from "../types";

const COUNTRY_BG: Record<string, string> = {
  KR: "bg-pink-100",
  JP: "bg-cream-100",
  CN: "bg-coral-50",
  US: "bg-[#EFEAE6]",
};

/**
 * 3D flip product card. Front: image, name, price, add-to-cart, wishlist.
 * Back: description and specs. Flipping is an explicit button (works for touch,
 * mouse and keyboard); the hidden face is `inert` so focus never lands on it.
 */
export function ProductCard({ product, priority = false, className }: { product: ProductCardData; priority?: boolean; className?: string }) {
  const t = useTranslations("product");
  const tb = useTranslations("badges");
  const locale = useLocale() as Locale;
  const { addToCart, pendingVariant, wishlist, toggleWishlist } = useStore();
  const [flipped, setFlipped] = React.useState(false);
  const [justAdded, setJustAdded] = React.useState(false);
  const inWishlist = wishlist.has(product.id);
  const outOfStock = product.stock <= 0 || !product.defaultVariantId;
  const adding = pendingVariant === product.defaultVariantId;
  const href = `/products/${product.slug}`;
  const size = product.volumeMl ? t("ml", { value: product.volumeMl }) : product.weightGrams ? t("grams", { value: product.weightGrams }) : null;

  async function onAdd() {
    if (!product.defaultVariantId || outOfStock) return;
    const ok = await addToCart(product.defaultVariantId, 1);
    if (ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1400);
    }
  }

  const wishlistBtn = (
    <button
      type="button"
      onClick={() => toggleWishlist(product.id)}
      aria-pressed={inWishlist}
      aria-label={inWishlist ? t("removeFromWishlist") : t("addToWishlist")}
      className="grid size-10 place-items-center rounded-full bg-white/90 ring-2 ring-ink/10 backdrop-blur transition-transform hover:scale-110 hover:ring-ink active:scale-95"
    >
      <Heart className={cn("size-5 transition-colors", inWishlist ? "fill-coral-500 text-coral-500" : "text-ink")} />
    </button>
  );

  const addBtn = (big?: boolean) => (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock || adding}
      aria-label={outOfStock ? t("outOfStock") : `${t("addToCart")}: ${product.name}`}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-ink bg-coral-500 text-ink shadow-pop-sm transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:border-ink/20 disabled:bg-ink/10 disabled:text-ink/40 disabled:shadow-none",
        big ? "h-11 w-full gap-2 px-4 font-bold" : "size-11",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {justAdded ? (
          <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
            <Check className="size-5" aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
            <Plus className={cn("size-5", adding && "animate-spin")} aria-hidden="true" />
            {big && (outOfStock ? t("outOfStock") : t("addToCart"))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  return (
    <article className={cn("flip-scene group h-full", className)} aria-label={product.name}>
      <div className="flip-inner" data-flipped={flipped}>
        {/* FRONT */}
        <div className="flip-face flex flex-col" inert={flipped}>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl border-2 border-ink bg-white transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_8px_0_0_var(--color-ink)]">
            <div className={cn("relative aspect-[1/1] overflow-hidden", COUNTRY_BG[product.country?.code ?? ""] ?? "bg-cream-100")}>
              <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
                {product.image && (
                  <ProductImage
                    src={product.image.url}
                    alt={product.image.alt}
                    fill
                    priority={priority}
                    sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
                    className={cn("object-cover transition-transform duration-500 group-hover:scale-[1.06]", outOfStock && "opacity-60 grayscale")}
                  />
                )}
              </Link>
              <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                {product.badges.slice(0, 2).map((b) => (
                  <Badge key={b} variant={b} size="sm">
                    {tb(b)}
                  </Badge>
                ))}
              </div>
              <div className="absolute top-3 right-3 z-10">{wishlistBtn}</div>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                aria-label={t("moreInfo", { name: product.name })}
                aria-expanded={flipped}
                className="absolute right-3 bottom-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 ring-2 ring-ink/10 backdrop-blur transition-transform hover:rotate-12 hover:ring-ink"
              >
                <Info className="size-5" />
              </button>
              {outOfStock && (
                <span className="absolute bottom-3 left-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{t("outOfStock")}</span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3.5 md:p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                {product.country && <Flag code={product.country.code} className="text-sm" />}
                <span className="truncate">{[product.country?.name, product.brand].filter(Boolean).join(" · ")}</span>
              </p>
              <h3 className="line-clamp-2 min-h-[2.6em] font-sans text-[0.98rem] leading-snug font-bold tracking-normal md:text-base">
                <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:underline">
                  {product.name}
                </Link>
              </h3>
              <div className="relative z-10 mt-auto flex items-end justify-between gap-2">
                <div className="leading-tight">
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <s className="block text-xs text-muted">{formatPrice(product.compareAtPrice, locale)}</s>
                  )}
                  <span className={cn("font-display text-lg font-bold md:text-xl", product.compareAtPrice && "text-coral-700")}>
                    {formatPrice(product.price, locale)}
                  </span>
                  {size && <span className="ml-1.5 text-xs text-muted">/ {size}</span>}
                </div>
                {addBtn()}
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-face flip-back" inert={!flipped} aria-hidden={!flipped}>
          <div className="flex h-full flex-col rounded-xl border-2 border-ink bg-ink p-4 text-cream-100 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-display text-xs font-bold tracking-wider text-pink-300 uppercase">
                {product.country && <Flag code={product.country.code} className="mr-1.5" />}
                {product.category.name}
              </p>
              <button
                type="button"
                onClick={() => setFlipped(false)}
                aria-label={t("flipBack")}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-cream-100/10 transition-transform hover:-rotate-45"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
            <h3 className="mt-2 font-display text-lg leading-tight font-bold text-white">{product.name}</h3>
            <p className="mt-2 line-clamp-4 text-sm text-cream-100/80">{product.shortDescription}</p>

            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
              {product.brand && <Spec label={t("brand")} value={product.brand} />}
              {size && <Spec label={product.volumeMl ? t("volume") : t("weight")} value={size} />}
              {product.country && <Spec label={t("country")} value={product.country.name} />}
              <div>
                <dt className="text-xs text-cream-100/55">{t("spice")}</dt>
                <dd className="mt-0.5">
                  <SpiceMeter level={product.spiceLevel} label={t(`spiceLevels.${product.spiceLevel}` as "spiceLevels.0")} />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-cream-100/55">{t("rating")}</dt>
                <dd className="mt-0.5 flex items-center gap-2">
                  <Stars value={product.rating} label={t("ratingStars", { value: product.rating.toFixed(1) })} />
                  <span className="text-xs text-cream-100/70">{t("reviewsCount", { count: product.reviewCount })}</span>
                </dd>
              </div>
            </dl>

            <div className="mt-auto grid gap-2 pt-4">
              {addBtn(true)}
              <Link
                href={href}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-cream-100/30 font-bold text-white transition-colors hover:border-white"
              >
                {t("open")} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-cream-100/55">{label}</dt>
      <dd className="truncate font-semibold text-white">{value}</dd>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-line bg-white" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-ink/[0.06]" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink/[0.07]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-ink/[0.07]" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-ink/[0.07]" />
      </div>
    </div>
  );
}
