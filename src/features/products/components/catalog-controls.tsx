"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Dialog as D } from "radix-ui";
import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Checkbox, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/brand/flag";
import { SORTS, type SortKey } from "../filters";

export type FacetOption = { value: string; label: string; count?: number; emoji?: string; countryCode?: string };

export type CatalogState = {
  q?: string;
  country: string[];
  category: string[];
  brand: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  spice?: number;
  rating?: number;
  new: boolean;
  popular: boolean;
  limited: boolean;
  sale: boolean;
  sort: SortKey;
};

type Facets = { countries: FacetOption[]; categories: FacetOption[]; brands: FacetOption[]; price: { min: number; max: number } };

function toQuery(s: CatalogState) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.country.length) p.set("country", s.country.join(","));
  if (s.category.length) p.set("category", s.category.join(","));
  if (s.brand.length) p.set("brand", s.brand.join(","));
  if (s.minPrice !== undefined) p.set("minPrice", String(s.minPrice));
  if (s.maxPrice !== undefined) p.set("maxPrice", String(s.maxPrice));
  if (s.inStock) p.set("inStock", "1");
  if (s.spice !== undefined) p.set("spice", String(s.spice));
  if (s.rating !== undefined) p.set("rating", String(s.rating));
  if (s.new) p.set("new", "1");
  if (s.popular) p.set("popular", "1");
  if (s.limited) p.set("limited", "1");
  if (s.sale) p.set("sale", "1");
  if (s.sort !== "recommended") p.set("sort", s.sort);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

function useNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = React.useTransition();
  const go = React.useCallback((s: CatalogState) => start(() => router.push(`${pathname}${toQuery(s)}`, { scroll: false })), [router, pathname]);
  return { go, pending };
}

export function SortSelect({ state }: { state: CatalogState }) {
  const t = useTranslations("catalog");
  const { go } = useNavigate();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="hidden text-sm font-semibold text-muted sm:block">
        {t("sort")}
      </label>
      <Select id="sort" value={state.sort} onChange={(e) => go({ ...state, sort: e.target.value as SortKey })} className="h-11 w-auto min-w-48 rounded-full font-semibold">
        {SORTS.map((s) => (
          <option key={s} value={s}>
            {t(`sortOptions.${s}`)}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Desktop sidebar + mobile bottom-sheet filters. Desktop applies instantly; mobile applies on "Show results". */
export function CatalogFilters({ state, facets, activeCount, total }: { state: CatalogState; facets: Facets; activeCount: number; total: number }) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const { go, pending } = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(state);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the mobile draft in sync with URL state
    setDraft(state);
  }, [state]);

  const reset: CatalogState = { q: state.q, country: [], category: [], brand: [], inStock: false, new: false, popular: false, limited: false, sale: false, sort: state.sort };

  return (
    <>
      {/* Mobile trigger */}
      <D.Root open={open} onOpenChange={setOpen}>
        <D.Trigger asChild>
          <Button variant="outline" className="lg:hidden">
            <SlidersHorizontal aria-hidden="true" /> {t("filters")}
            {activeCount > 0 && <span className="grid size-6 place-items-center rounded-full bg-coral-500 text-xs">{activeCount}</span>}
          </Button>
        </D.Trigger>
        <SheetContent side="bottom" closeLabel={tc("close")} aria-describedby={undefined}>
          <div className="border-b-2 border-line px-5 py-4 pr-16">
            <D.Title className="font-display text-xl font-bold">{t("filters")}</D.Title>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <FilterFields state={draft} facets={facets} onChange={setDraft} idPrefix="m" />
          </div>
          <div className="flex gap-3 border-t-2 border-line bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="ghost" onClick={() => setDraft(reset)}>
              {tc("reset")}
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={() => {
                go(draft);
                setOpen(false);
              }}
            >
              {t("showResults")}
            </Button>
          </div>
        </SheetContent>
      </D.Root>

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:block", pending && "opacity-70")} aria-label={t("filters")}>
        <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-xl border-2 border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">{t("filters")}</h2>
            {activeCount > 0 && (
              <button type="button" onClick={() => go(reset)} className="inline-flex items-center gap-1 text-sm font-semibold text-coral-700 hover:underline">
                <X className="size-4" aria-hidden="true" /> {t("clearFilters")}
              </button>
            )}
          </div>
          <FilterFields state={state} facets={facets} onChange={go} idPrefix="d" debouncePrice />
          <p className="mt-4 text-sm text-muted" aria-live="polite">
            {t("results", { count: total })}
          </p>
        </div>
      </aside>
    </>
  );
}

function FilterFields({
  state,
  facets,
  onChange,
  idPrefix,
  debouncePrice,
}: {
  state: CatalogState;
  facets: Facets;
  onChange: (s: CatalogState) => void;
  idPrefix: string;
  debouncePrice?: boolean;
}) {
  const t = useTranslations("catalog");
  const tp = useTranslations("product");
  const toggle = (key: "country" | "category" | "brand", value: string) => {
    const list = state[key].includes(value) ? state[key].filter((v) => v !== value) : [...state[key], value];
    onChange({ ...state, [key]: list });
  };

  return (
    <div className="space-y-6">
      <FilterGroup title={t("flags")}>
        <div className="flex flex-wrap gap-2">
          {(["new", "popular", "limited", "sale"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={state[k]}
              onClick={() => onChange({ ...state, [k]: !state[k] })}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
                state[k] ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink",
              )}
            >
              {t(k)}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t("country")}>
        {facets.countries.map((o) => (
          <CheckRow key={o.value} id={`${idPrefix}-c-${o.value}`} checked={state.country.includes(o.value)} onChange={() => toggle("country", o.value)} label={<><Flag code={o.countryCode} className="mr-2" />{o.label}</>} count={o.count} />
        ))}
      </FilterGroup>

      <FilterGroup title={t("category")}>
        {facets.categories.map((o) => (
          <CheckRow key={o.value} id={`${idPrefix}-cat-${o.value}`} checked={state.category.includes(o.value)} onChange={() => toggle("category", o.value)} label={`${o.emoji ?? ""} ${o.label}`} count={o.count} />
        ))}
      </FilterGroup>

      <FilterGroup title={t("price")}>
        <PriceRange state={state} bounds={facets.price} onChange={onChange} debounce={debouncePrice} idPrefix={idPrefix} />
      </FilterGroup>

      <FilterGroup title={t("availability")}>
        <CheckRow id={`${idPrefix}-stock`} checked={state.inStock} onChange={() => onChange({ ...state, inStock: !state.inStock })} label={t("inStockOnly")} />
      </FilterGroup>

      <FilterGroup title={t("spiceLevel")}>
        <div className="flex flex-wrap gap-2">
          {[undefined, 0, 1, 3, 5].map((lvl) => (
            <button
              key={String(lvl)}
              type="button"
              aria-pressed={state.spice === lvl}
              onClick={() => onChange({ ...state, spice: lvl })}
              className={cn(
                "rounded-full border-2 px-3 py-1.5 text-sm font-semibold",
                state.spice === lvl ? "border-ink bg-coral-500" : "border-line bg-white hover:border-ink",
              )}
            >
              {lvl === undefined ? t("anySpice") : lvl === 0 ? tp("spiceLevels.0") : `🌶️ ${t("maxSpice", { level: lvl })}`}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t("minRating")}>
        <div className="flex flex-wrap gap-2">
          {[undefined, 3, 4, 4.5].map((r) => (
            <button
              key={String(r)}
              type="button"
              aria-pressed={state.rating === r}
              onClick={() => onChange({ ...state, rating: r })}
              className={cn("rounded-full border-2 px-3 py-1.5 text-sm font-semibold", state.rating === r ? "border-ink bg-pink-300" : "border-line bg-white hover:border-ink")}
            >
              {r === undefined ? t("anyRating") : t("ratingFrom", { value: r })}
            </button>
          ))}
        </div>
      </FilterGroup>

      {facets.brands.length > 0 && (
        <FilterGroup title={t("brand")}>
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {facets.brands.map((o) => (
              <CheckRow key={o.value} id={`${idPrefix}-b-${o.value}`} checked={state.brand.includes(o.value)} onChange={() => toggle("brand", o.value)} label={o.label} count={o.count} />
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-bold tracking-wider text-muted uppercase">{title}</legend>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function CheckRow({ id, checked, onChange, label, count }: { id: string; checked: boolean; onChange: () => void; label: React.ReactNode; count?: number }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 hover:bg-cream-100">
      <Checkbox id={id} checked={checked} onChange={onChange} />
      <span className="flex-1 text-[0.95rem] font-medium">{label}</span>
      {count !== undefined && <span className="text-xs text-muted tabular-nums">{count}</span>}
    </label>
  );
}

function PriceRange({
  state,
  bounds,
  onChange,
  debounce,
  idPrefix,
}: {
  state: CatalogState;
  bounds: { min: number; max: number };
  onChange: (s: CatalogState) => void;
  debounce?: boolean;
  idPrefix: string;
}) {
  const t = useTranslations("catalog");
  const [min, setMin] = React.useState(state.minPrice?.toString() ?? "");
  const [max, setMax] = React.useState(state.maxPrice?.toString() ?? "");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflect external (URL) changes
    setMin(state.minPrice?.toString() ?? "");
    setMax(state.maxPrice?.toString() ?? "");
  }, [state.minPrice, state.maxPrice]);

  const commit = React.useCallback(
    (a: string, b: string) => {
      const toNum = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? undefined : Math.max(0, Number(v)));
      onChange({ ...state, minPrice: toNum(a), maxPrice: toNum(b) });
    },
    [onChange, state],
  );

  React.useEffect(() => {
    if (!debounce) return;
    if (min === (state.minPrice?.toString() ?? "") && max === (state.maxPrice?.toString() ?? "")) return;
    const id = setTimeout(() => commit(min, max), 600);
    return () => clearTimeout(id);
  }, [min, max, debounce, commit, state.minPrice, state.maxPrice]);

  const inputCls = "h-11 w-full rounded-md border-2 border-line bg-white px-3 text-sm font-semibold outline-none focus:border-ink";
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`${idPrefix}-min`}>
        {t("min")}
      </label>
      <input
        id={`${idPrefix}-min`}
        inputMode="numeric"
        type="number"
        min={0}
        placeholder={`${t("min")} ${bounds.min}`}
        value={min}
        onChange={(e) => {
          setMin(e.target.value);
          if (!debounce) commit(e.target.value, max);
        }}
        className={inputCls}
      />
      <span aria-hidden="true">—</span>
      <label className="sr-only" htmlFor={`${idPrefix}-max`}>
        {t("max")}
      </label>
      <input
        id={`${idPrefix}-max`}
        inputMode="numeric"
        type="number"
        min={0}
        placeholder={`${t("max")} ${bounds.max}`}
        value={max}
        onChange={(e) => {
          setMax(e.target.value);
          if (!debounce) commit(min, e.target.value);
        }}
        className={inputCls}
      />
    </div>
  );
}
