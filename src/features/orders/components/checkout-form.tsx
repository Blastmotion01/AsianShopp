"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Store, Truck, Bike, Package, CreditCard, Banknote, Lock, Info } from "lucide-react";
import type { DeliveryMethod, PaymentMethod } from "@prisma/client";
import { useRouter, Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/product/product-image";
import { useStore } from "@/features/store/store-provider";
import { computeTotals } from "@/features/cart/pricing";
import { DELIVERY_METHODS, DNIPRO_ONLY, NEEDS_ADDRESS, NEEDS_BRANCH } from "@/lib/integrations/delivery";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/site";
import { placeOrderAction } from "../actions";

type SavedAddress = { id: string; label: string | null; firstName: string; lastName: string; phone: string; city: string; deliveryMethod: DeliveryMethod; branch: string | null; street: string | null };

const METHOD_ICON: Record<DeliveryMethod, React.ReactNode> = {
  NOVA_POSHTA_BRANCH: <Package />,
  NOVA_POSHTA_COURIER: <Truck />,
  COURIER_DNIPRO: <Bike />,
  PICKUP_DNIPRO: <Store />,
};

export function CheckoutForm({
  defaults,
  addresses,
  isGuest,
  paymentTestMode,
}: {
  defaults: { firstName: string; lastName: string; phone: string; email: string };
  addresses: SavedAddress[];
  isGuest: boolean;
  paymentTestMode: boolean;
}) {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const te = useTranslations("errors");
  const tv = useTranslations("validation");
  const tcommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { cart, ready, refresh } = useStore();
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [form, setForm] = React.useState({
    ...defaults,
    city: "Дніпро",
    deliveryMethod: "NOVA_POSHTA_BRANCH" as DeliveryMethod,
    branch: "",
    address: "",
    comment: "",
    paymentMethod: "CASH_ON_DELIVERY" as PaymentMethod,
    saveAddress: false,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k as string];
      return n;
    });
  };

  const applyAddress = (a: SavedAddress) =>
    setForm((f) => ({ ...f, firstName: a.firstName, lastName: a.lastName, phone: a.phone, city: a.city, deliveryMethod: a.deliveryMethod, branch: a.branch ?? "", address: a.street ?? "" }));

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <Skeleton className="h-[600px] rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const lines = (cart?.lines ?? []).filter((l) => l.available);
  if (!cart || lines.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title={tc("empty")}
        text={t("emptyCart")}
        action={
          <Button asChild variant="accent">
            <Link href="/products">{tc("continue")}</Link>
          </Button>
        }
      />
    );
  }

  const totals = computeTotals(
    lines.map((l) => ({ unitPrice: l.unitPrice, quantity: Math.min(l.quantity, l.stock) })),
    { discount: cart.promo?.discount ?? 0, deliveryMethod: form.deliveryMethod, freeShippingThreshold: cart.totals.freeShippingThreshold },
  );

  const errMsg = (k: string) => (errors[k] ? (tv.has(errors[k]) ? tv(errors[k]) : te.has(errors[k]) ? te(errors[k]) : tv("invalid")) : undefined);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await placeOrderAction(form);
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        if (res.error === "validation") {
          toast.error(te("validation"));
          const first = Object.keys(res.fieldErrors ?? {})[0];
          if (first) document.getElementById(`co-${first}`)?.focus();
        } else {
          const values: Record<string, string | number> = {};
          if (res.meta?.minOrder) values.amount = formatPrice(Number(res.meta.minOrder), locale);
          toast.error(te.has(res.error) ? te(res.error, values) : te("generic"));
          if (["insufficient_stock", "cart_changed", "cart_empty", "promo_limit", "promo_expired", "promo_invalid", "promo_min_order"].includes(res.error)) void refresh();
        }
        return;
      }
      await refresh();
      router.push(res.data.redirectUrl ?? `/checkout/success/${res.data.orderId}`);
    });
  }

  const needsBranch = NEEDS_BRANCH.includes(form.deliveryMethod);
  const needsAddress = NEEDS_ADDRESS.includes(form.deliveryMethod);
  const dniproOnly = DNIPRO_ONLY.includes(form.deliveryMethod);

  return (
    <form onSubmit={submit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        {isGuest && (
          <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm">
            {t("loginSuggestion")}{" "}
            <Link href="/login?next=/checkout" className="font-bold text-coral-700 underline">
              {t("loginLink")}
            </Link>
            , {t("loginSuggestionTail")}
          </p>
        )}

        <Step n={1} title={t("contact")}>
          {addresses.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-bold">{t("savedAddresses")}</p>
              <div className="flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button key={a.id} type="button" onClick={() => applyAddress(a)} className="rounded-full border-2 border-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-ink">
                    {a.label || `${a.city}, ${a.branch ?? a.street ?? ""}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="firstName" label={t("firstName")} value={form.firstName} onChange={(v) => set("firstName", v)} error={errMsg("firstName")} autoComplete="given-name" />
            <TextField id="lastName" label={t("lastName")} value={form.lastName} onChange={(v) => set("lastName", v)} error={errMsg("lastName")} autoComplete="family-name" />
            <TextField id="phone" label={t("phone")} value={form.phone} onChange={(v) => set("phone", v)} error={errMsg("phone")} autoComplete="tel" type="tel" placeholder="+380" />
            <TextField id="email" label={t("email")} value={form.email} onChange={(v) => set("email", v)} error={errMsg("email")} autoComplete="email" type="email" />
          </div>
        </Step>

        <Step n={2} title={t("delivery")}>
          <fieldset>
            <legend className="sr-only">{t("method")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_METHODS.map((m) => (
                <RadioCard
                  key={m}
                  name="deliveryMethod"
                  checked={form.deliveryMethod === m}
                  onChange={() => set("deliveryMethod", m)}
                  icon={METHOD_ICON[m]}
                  title={t(`methods.${m}`)}
                  hint={t(`methodHints.${m}`)}
                  aside={
                    m === "PICKUP_DNIPRO" || (totals.freeShippingThreshold !== null && totals.subtotal - totals.discount >= totals.freeShippingThreshold)
                      ? t("free")
                      : formatPrice(computeTotals([], { deliveryMethod: m, freeShippingThreshold: null }).deliveryFee, locale)
                  }
                />
              ))}
            </div>
          </fieldset>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {dniproOnly ? (
              <p className="flex items-center gap-2 rounded-md bg-pink-100 px-4 py-3 text-sm font-semibold sm:col-span-2">
                <Info className="size-4" aria-hidden="true" /> {t("dniproOnly")} — Дніпро
              </p>
            ) : (
              <TextField id="city" label={t("city")} value={form.city} onChange={(v) => set("city", v)} error={errMsg("city")} autoComplete="address-level2" />
            )}
            {needsBranch && <TextField id="branch" label={t("branch")} value={form.branch} onChange={(v) => set("branch", v)} error={errMsg("branch")} placeholder={t("branchPlaceholder")} />}
            {needsAddress && (
              <TextField
                id="address"
                label={t("address")}
                value={form.address}
                onChange={(v) => set("address", v)}
                error={errMsg("address")}
                placeholder={t("addressPlaceholder")}
                autoComplete="street-address"
                className={dniproOnly ? "sm:col-span-2" : ""}
              />
            )}
          </div>
          <Field label={`${t("comment")} (${tcommon("optional")})`} htmlFor="co-comment" className="mt-4">
            <Textarea id="co-comment" value={form.comment} onChange={(e) => set("comment", e.target.value)} maxLength={1000} />
          </Field>
        </Step>

        <Step n={3} title={t("payment")}>
          <fieldset>
            <legend className="sr-only">{t("payment")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["CASH_ON_DELIVERY", "CARD_ONLINE"] as const).map((p) => (
                <RadioCard
                  key={p}
                  name="paymentMethod"
                  checked={form.paymentMethod === p}
                  onChange={() => set("paymentMethod", p)}
                  icon={p === "CARD_ONLINE" ? <CreditCard /> : <Banknote />}
                  title={t(`paymentMethods.${p}`)}
                  hint={t(`paymentHints.${p}`)}
                />
              ))}
            </div>
          </fieldset>
          {form.paymentMethod === "CARD_ONLINE" && paymentTestMode && (
            <p className="mt-3 flex items-start gap-2 rounded-md bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {t("paymentTestNote")}
            </p>
          )}
          {!isGuest && (
            <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
              <Checkbox checked={form.saveAddress} onChange={(e) => set("saveAddress", e.target.checked)} />
              {t("saveAddress")}
            </label>
          )}
        </Step>
      </div>

      {/* Summary */}
      <aside className="rounded-2xl border-2 border-ink bg-white p-5 shadow-pop lg:sticky lg:top-28">
        <h2 className="font-display text-xl font-bold">{t("summary")}</h2>
        <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-center gap-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-100">
                {l.image && <ProductImage src={l.image} alt="" fill sizes="56px" className="object-cover" />}
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-ink text-[0.65rem] font-bold text-white">{l.quantity}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm leading-tight font-semibold">
                {l.name}
                {l.variantName && <span className="block font-normal text-muted">{l.variantName}</span>}
              </span>
              <span className="text-sm font-bold">{formatPrice(l.unitPrice * l.quantity, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t-2 border-line pt-4 text-sm">
          <Row label={tc("subtotal")} value={formatPrice(totals.subtotal, locale)} />
          {totals.discount > 0 && <Row label={`${tc("discount")} (${cart.promo?.code})`} value={`−${formatPrice(totals.discount, locale)}`} accent />}
          <Row label={t("deliveryFee")} value={totals.deliveryFee === 0 ? t("free") : formatPrice(totals.deliveryFee, locale)} />
          <div className="flex items-baseline justify-between border-t-2 border-line pt-3">
            <dt className="font-display text-lg font-bold">{tc("total")}</dt>
            <dd className="font-display text-3xl font-extrabold">{formatPrice(totals.total, locale)}</dd>
          </div>
        </dl>
        <Button type="submit" variant="accent" size="lg" className="mt-5 w-full" loading={pending}>
          <Lock aria-hidden="true" /> {pending ? t("placing") : t("placeOrder")}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">{t("agree")}</p>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-line bg-white p-5 md:p-7" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-5 flex items-center gap-3 font-display text-xl font-bold">
        <span className="grid size-9 place-items-center rounded-full bg-pink-300 text-base" aria-hidden="true">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  className,
  ...rest
}: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; className?: string } & Omit<React.ComponentProps<"input">, "onChange" | "value" | "id">) {
  return (
    <Field label={label} htmlFor={`co-${id}`} error={error} className={className}>
      <Input id={`co-${id}`} name={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `co-${id}-error` : undefined} {...rest} />
    </Field>
  );
}

function RadioCard({ name, checked, onChange, icon, title, hint, aside }: { name: string; checked: boolean; onChange: () => void; icon: React.ReactNode; title: string; hint: string; aside?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-coral-500",
        checked ? "border-ink bg-cream-100 shadow-pop-sm" : "border-line bg-white hover:border-ink/40",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink [&_svg]:size-5", checked ? "bg-coral-500" : "bg-white")} aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      {aside && <span className="shrink-0 text-sm font-bold">{aside}</span>}
    </label>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("flex justify-between", accent && "text-coral-700")}>
      <dt className={accent ? "" : "text-muted"}>{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
