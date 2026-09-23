"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog as D } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, Trash2, Tag, X, Truck } from "lucide-react";
import { SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { useStore } from "@/features/store/store-provider";
import { formatPrice } from "@/lib/money";
import { MAX_CART_QTY, type Locale } from "@/config/site";
import type { CartLine, CartView } from "../service";

export function CartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const { cart, cartOpen, setCartOpen } = useStore();
  const lines = cart?.lines ?? [];

  return (
    <D.Root open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" closeLabel={tc("close")} aria-describedby={undefined}>
        <div className="border-b-2 border-line px-5 py-5 pr-16">
          <D.Title className="font-display text-2xl font-bold">
            {t("title")} {lines.length > 0 && <span className="text-muted">· {t("items", { count: cart?.count ?? 0 })}</span>}
          </D.Title>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              emoji="🛍️"
              title={t("empty")}
              text={t("emptyText")}
              action={
                <Button asChild variant="accent" onClick={() => setCartOpen(false)}>
                  <Link href="/products">{t("continue")}</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {cart && <FreeShippingBar cart={cart} />}
            <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.variantId}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                  >
                    <CartLineRow line={line} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {cart && <CartSummary cart={cart} onNavigate={() => setCartOpen(false)} />}
          </>
        )}
      </SheetContent>
    </D.Root>
  );
}

function FreeShippingBar({ cart }: { cart: CartView }) {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const { freeShippingLeft, freeShippingThreshold } = cart.totals;
  if (freeShippingThreshold === null || freeShippingLeft === null) return null;
  const pct = Math.min(100, Math.round(((freeShippingThreshold - freeShippingLeft) / freeShippingThreshold) * 100));
  return (
    <div className="border-b-2 border-line bg-cream-100 px-5 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="size-4 text-coral-600" aria-hidden="true" />
        {freeShippingLeft > 0 ? t("freeShippingLeft", { amount: formatPrice(freeShippingLeft, locale) }) : t("freeShippingReached")}
      </p>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-ink/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="h-full rounded-full bg-coral-500" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </div>
    </div>
  );
}

function CartLineRow({ line }: { line: CartLine }) {
  const t = useTranslations("cart");
  const tp = useTranslations("product");
  const locale = useLocale() as Locale;
  const { setQuantity, setCartOpen } = useStore();
  const max = Math.min(line.stock, MAX_CART_QTY);

  return (
    <div className={`flex gap-3 rounded-lg border-2 border-line bg-white p-3 ${line.available ? "" : "opacity-60"}`}>
      <Link href={`/products/${line.slug}`} onClick={() => setCartOpen(false)} className="relative size-20 shrink-0 overflow-hidden rounded-md bg-cream-100">
        {line.image && <ProductImage src={line.image} alt={line.name} fill sizes="80px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <Link href={`/products/${line.slug}`} onClick={() => setCartOpen(false)} className="min-w-0 flex-1 leading-tight font-semibold hover:underline">
            {line.name}
            {line.variantName && <span className="block text-sm font-normal text-muted">{line.variantName}</span>}
          </Link>
          <button
            type="button"
            onClick={() => setQuantity(line.variantId, 0)}
            aria-label={t("remove", { name: line.name })}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-error-soft hover:text-error"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        {!line.available ? (
          <p className="mt-1 text-sm font-semibold text-error">{t("unavailable")}</p>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-2">
            <QtyStepper
              value={line.quantity}
              max={max}
              onChange={(q) => setQuantity(line.variantId, q)}
              labels={{ inc: tp("increase"), dec: tp("decrease"), qty: tp("quantity") }}
            />
            <span className="font-display font-bold">{formatPrice(line.unitPrice * line.quantity, locale)}</span>
          </div>
        )}
        {line.available && line.quantity > line.stock && <p className="mt-1 text-xs text-error">{t("onlyLeft", { count: line.stock })}</p>}
      </div>
    </div>
  );
}

export function QtyStepper({
  value,
  max,
  onChange,
  labels,
  size = "sm",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  labels: { inc: string; dec: string; qty: string };
  size?: "sm" | "lg";
}) {
  const btn = size === "lg" ? "size-12" : "size-8";
  return (
    <div className="inline-flex items-center rounded-full border-2 border-ink bg-white" role="group" aria-label={labels.qty}>
      <button type="button" className={`grid ${btn} place-items-center rounded-full hover:bg-cream-100 disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={labels.dec}>
        <Minus className="size-4" />
      </button>
      <span className={`min-w-8 text-center font-bold tabular-nums ${size === "lg" ? "text-lg" : "text-sm"}`} aria-live="polite">
        {value}
      </span>
      <button type="button" className={`grid ${btn} place-items-center rounded-full hover:bg-cream-100 disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={labels.inc}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function CartSummary({ cart, onNavigate }: { cart: CartView; onNavigate: () => void }) {
  const t = useTranslations("cart");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const { applyPromo, removePromo } = useStore();
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const ok = await applyPromo(code);
    setBusy(false);
    if (ok) setCode("");
  }

  const promoErr = cart.promo?.error
    ? te(cart.promo.error, { amount: cart.promo.meta?.minOrder ? formatPrice(Number(cart.promo.meta.minOrder), locale) : "" })
    : null;

  return (
    <div className="border-t-2 border-ink bg-white px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {cart.promo ? (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-pink-100 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 font-bold">
            <Tag className="size-4" aria-hidden="true" /> {cart.promo.code}
          </span>
          <button type="button" onClick={removePromo} className="grid size-7 place-items-center rounded-full hover:bg-white" aria-label={t("removePromo")}>
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={onApply} className="mb-3 flex gap-2">
          <label htmlFor="cart-promo" className="sr-only">
            {t("promo")}
          </label>
          <input
            id="cart-promo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("promoPlaceholder")}
            maxLength={40}
            className="h-11 min-w-0 flex-1 rounded-full border-2 border-line bg-white px-4 text-sm font-semibold uppercase outline-none placeholder:normal-case focus:border-ink"
          />
          <Button type="submit" variant="outline" size="md" loading={busy}>
            {t("applyPromo")}
          </Button>
        </form>
      )}
      {promoErr && <p className="-mt-1 mb-3 text-sm font-medium text-error">{promoErr}</p>}

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">{t("subtotal")}</dt>
          <dd className="font-semibold">{formatPrice(cart.totals.subtotal, locale)}</dd>
        </div>
        {cart.totals.discount > 0 && (
          <div className="flex justify-between text-coral-700">
            <dt>{t("discount")}</dt>
            <dd className="font-semibold">−{formatPrice(cart.totals.discount, locale)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-1">
          <dt className="font-display text-lg font-bold">{t("total")}</dt>
          <dd className="font-display text-2xl font-bold">{formatPrice(cart.totals.total, locale)}</dd>
        </div>
        <p className="text-xs text-muted">{t("deliveryCalculated")}</p>
      </dl>
      <Button asChild variant="accent" size="lg" className="mt-4 w-full">
        <Link href="/checkout" onClick={onNavigate}>
          {t("checkout")}
        </Link>
      </Button>
    </div>
  );
}
