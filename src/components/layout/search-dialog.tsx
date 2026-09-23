"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Link, useRouter } from "@/i18n/navigation";
import { ProductImage } from "@/components/product/product-image";
import { Flag } from "@/components/brand/flag";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

type Suggestion = { id: string; slug: string; name: string; brand: string | null; price: number; image: { url: string; alt: string } | null; countryCode: string | null };

const RECENT_KEY = "as_recent_searches";

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 6);
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  try {
    const next = [q, ...readRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function SearchDialog({ open, onOpenChange, popular }: { open: boolean; onOpenChange: (o: boolean) => void; popular: string[] }) {
  const t = useTranslations("search");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [results, setItems] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [active, setActive] = React.useState(-1);
  const listId = React.useId();
  // Suggestions only apply to a 2+ char query (derived instead of reset in an effect).
  const items = q.trim().length >= 2 ? results : [];

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from localStorage when opened
    if (open) setRecent(readRecent());
  }, [open]);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&locale=${locale}`, { signal: ctrl.signal });
        const data = await res.json();
        if (data.ok) {
          setItems(data.items);
          setActive(-1);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, locale]);

  function submit(term: string) {
    const v = term.trim();
    if (!v) return;
    pushRecent(v);
    onOpenChange(false);
    router.push(`/products?q=${encodeURIComponent(v)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) {
        pushRecent(q.trim());
        onOpenChange(false);
        router.push(`/products/${items[active].slug}`);
      } else submit(q);
    }
  }

  const showEmpty = q.trim().length >= 2 && !loading && items.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={tc("close")} className="top-4 max-w-2xl translate-y-0 p-0 md:top-20" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{t("label")}</DialogTitle>
        <div className="flex items-center gap-3 border-b-2 border-line px-5 py-4 pr-14">
          <Search className="size-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("placeholder")}
            aria-label={t("label")}
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className="h-10 w-full bg-transparent text-lg font-semibold outline-none placeholder:text-muted/60"
            maxLength={80}
          />
        </div>

        <div className="max-h-[60dvh] overflow-y-auto p-3">
          {items.length > 0 && (
            <ul id={listId} role="listbox" aria-label={t("products")}>
              {items.map((it, i) => (
                <li key={it.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={`/products/${it.slug}`}
                    onClick={() => {
                      pushRecent(q.trim());
                      onOpenChange(false);
                    }}
                    className={`flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-cream-100 ${i === active ? "bg-cream-100" : ""}`}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-100">
                      {it.image && <ProductImage src={it.image.url} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{it.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {it.countryCode && <Flag code={it.countryCode} className="mr-1" />} {it.brand}
                      </span>
                    </span>
                    <span className="font-display font-bold">{formatPrice(it.price, locale)}</span>
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <button type="button" onClick={() => submit(q)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink/5 p-3 text-sm font-bold hover:bg-ink/10">
                  {t("viewAll")} <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </li>
            </ul>
          )}

          {showEmpty && <p className="p-6 text-center text-muted">{t("noResults", { q: q.trim() })}</p>}

          {q.trim().length < 2 && (
            <div className="grid gap-6 p-2 md:grid-cols-2">
              {recent.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-wider text-muted uppercase">{t("recent")}</h3>
                    <button
                      type="button"
                      className="text-xs font-semibold text-coral-700 hover:underline"
                      onClick={() => {
                        try {
                          localStorage.removeItem(RECENT_KEY);
                        } catch {}
                        setRecent([]);
                      }}
                    >
                      {t("clearRecent")}
                    </button>
                  </div>
                  <ul className="space-y-1">
                    {recent.map((r) => (
                      <li key={r}>
                        <button type="button" onClick={() => submit(r)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-cream-100">
                          <Clock className="size-4 text-muted" aria-hidden="true" /> {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h3 className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{t("popular")}</h3>
                <ul className="flex flex-wrap gap-2">
                  {popular.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => submit(p)}
                        className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/10 bg-white px-3 py-1.5 text-sm font-semibold hover:border-ink"
                      >
                        <TrendingUp className="size-3.5 text-coral-600" aria-hidden="true" /> {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
