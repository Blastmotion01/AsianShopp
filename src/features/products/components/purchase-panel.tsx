"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QtyStepper } from "@/features/cart/components/cart-drawer";
import { useStore } from "@/features/store/store-provider";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MAX_CART_QTY, type Locale } from "@/config/site";
import type { ProductVariantView } from "../types";

export function PurchasePanel({ productId, variants }: { productId: string; variants: ProductVariantView[] }) {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;
  const { addToCart, pendingVariant, wishlist, toggleWishlist } = useStore();
  const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = React.useState(firstAvailable?.id);
  const [qty, setQty] = React.useState(1);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const inWishlist = wishlist.has(productId);

  if (!variant) return <p className="font-semibold text-error">{t("outOfStock")}</p>;
  const max = Math.min(variant.stock, MAX_CART_QTY);
  const out = variant.stock <= 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className={cn("font-display text-4xl font-extrabold", variant.compareAtPrice && "text-coral-700")}>{formatPrice(variant.price, locale)}</span>
        {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
          <>
            <s className="text-lg text-muted">{formatPrice(variant.compareAtPrice, locale)}</s>
            <span className="rounded-full bg-coral-700 px-2.5 py-1 text-sm font-bold text-white">
              −{Math.round((1 - variant.price / variant.compareAtPrice) * 100)}%
            </span>
          </>
        )}
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold">{t("variant")}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={cn(
                  "cursor-pointer rounded-full border-2 px-4 py-2 font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coral-500",
                  v.id === variantId ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink",
                  v.stock <= 0 && "opacity-50",
                )}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  className="sr-only"
                />
                {v.name} · {formatPrice(v.price, locale)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p className={cn("flex items-center gap-2 text-sm font-bold", out ? "text-error" : variant.stock <= 5 ? "text-warning" : "text-success")}>
        <span className={cn("size-2.5 rounded-full", out ? "bg-error" : variant.stock <= 5 ? "bg-warning" : "bg-success")} aria-hidden="true" />
        {out ? t("outOfStock") : variant.stock <= 5 ? t("lowStock", { count: variant.stock }) : t("inStock")}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {!out && (
          <QtyStepper value={qty} max={max} onChange={(v) => setQty(Math.max(1, Math.min(max, v)))} size="lg" labels={{ inc: t("increase"), dec: t("decrease"), qty: t("quantity") }} />
        )}
        <Button
          variant="accent"
          size="lg"
          className="min-w-52 flex-1"
          disabled={out}
          loading={pendingVariant === variant.id}
          onClick={async () => {
            const ok = await addToCart(variant.id, qty);
            if (ok) setQty(1);
          }}
        >
          {out ? (
            t("outOfStock")
          ) : (
            <>
              <ShoppingBag aria-hidden="true" /> {t("addToCart")}
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={() => toggleWishlist(productId)}
          aria-pressed={inWishlist}
          aria-label={inWishlist ? t("removeFromWishlist") : t("addToWishlist")}
          className="grid size-14 place-items-center rounded-full border-2 border-ink bg-white shadow-pop-sm transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          {inWishlist ? <Heart className="size-6 fill-coral-500 text-coral-500" /> : <Heart className="size-6" />}
        </button>
      </div>
      {inWishlist && (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Check className="size-4" aria-hidden="true" /> {t("wishlistAdded")}
        </p>
      )}
    </div>
  );
}
