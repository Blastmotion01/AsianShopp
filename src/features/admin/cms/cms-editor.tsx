"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { reorderBlocksAction, saveBlockAction, saveCategoryHomeAction, saveSettingsAction } from "./actions";

type L3 = { uk: string; ru: string; en: string };
export type CmsBlock = { key: string; type: "hero" | "section" | "banner" | "announcement"; data: Record<string, unknown>; isActive: boolean };

/** Which fields each block type exposes; localized ones get uk/ru/en inputs. */
const FIELDS: Record<CmsBlock["type"], { name: string; localized: boolean; long?: boolean }[]> = {
  hero: [
    { name: "eyebrow", localized: true },
    { name: "title", localized: true },
    { name: "highlight", localized: true },
    { name: "subtitle", localized: true, long: true },
    { name: "ctaLabel", localized: true },
    { name: "ctaHref", localized: false },
    { name: "secondaryLabel", localized: true },
    { name: "secondaryHref", localized: false },
  ],
  section: [
    { name: "title", localized: true },
    { name: "subtitle", localized: true, long: true },
  ],
  banner: [
    { name: "title", localized: true },
    { name: "text", localized: true, long: true },
    { name: "code", localized: false },
    { name: "ctaLabel", localized: true },
    { name: "ctaHref", localized: false },
  ],
  announcement: [
    { name: "text", localized: true },
    { name: "href", localized: false },
  ],
};

export function CmsEditor({
  blocks: initialBlocks,
  settings,
  categories: initialCats,
}: {
  blocks: CmsBlock[];
  settings: { freeShippingEnabled: boolean; freeShippingThreshold: number };
  categories: { id: string; name: string; showOnHome: boolean }[];
}) {
  const t = useTranslations("admin.cms");
  const [blocks, setBlocks] = React.useState(initialBlocks);
  const [openKey, setOpenKey] = React.useState<string | null>("hero");
  const [pending, start] = React.useTransition();
  const router = useRouter();

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
    start(async () => {
      const res = await reorderBlocksAction(next.map((b) => b.key));
      if (res.ok) toast.success(t("saved"));
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section>
        <h2 className="font-display text-lg font-bold">{t("blocks")}</h2>
        <p className="mb-4 text-sm text-muted">{t("blocksHint")}</p>
        <ul className="space-y-3" aria-busy={pending}>
          {blocks.map((b, i) => (
            <li key={b.key} className={cn("rounded-xl border-2 bg-white", openKey === b.key ? "border-ink" : "border-line", !b.isActive && "opacity-70")}>
              <div className="flex items-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => setOpenKey(openKey === b.key ? null : b.key)}
                  className="flex flex-1 items-center gap-2 text-left font-semibold"
                  aria-expanded={openKey === b.key}
                >
                  <ChevronDown className={cn("size-4 transition-transform", openKey === b.key && "rotate-180")} aria-hidden="true" />
                  {t(`blockNames.${b.key}`)}
                  {b.isActive ? <Eye className="size-4 text-success" aria-label={t("visible")} /> : <EyeOff className="size-4 text-muted" />}
                </button>
                {b.key !== "announcement" && (
                  <>
                    <button type="button" onClick={() => move(i, -1)} disabled={i <= 1 || pending} className="grid size-8 place-items-center rounded-full hover:bg-ink/5 disabled:opacity-30" aria-label={t("moveUp")}>
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1 || pending} className="grid size-8 place-items-center rounded-full hover:bg-ink/5 disabled:opacity-30" aria-label={t("moveDown")}>
                      <ArrowDown className="size-4" />
                    </button>
                  </>
                )}
              </div>
              {openKey === b.key && (
                <BlockForm
                  block={b}
                  onSaved={(nb) => {
                    setBlocks((all) => all.map((x) => (x.key === nb.key ? nb : x)));
                    router.refresh();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-6">
        <SettingsForm initial={settings} />
        <CategoriesForm initial={initialCats} />
      </div>
    </div>
  );
}

function BlockForm({ block, onSaved }: { block: CmsBlock; onSaved: (b: CmsBlock) => void }) {
  const t = useTranslations("admin.cms");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const [data, setData] = React.useState<Record<string, unknown>>(block.data);
  const [active, setActive] = React.useState(block.isActive);
  const [lang, setLang] = React.useState<keyof L3>("uk");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await saveBlockAction({ key: block.key, data, isActive: active });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(te.has(res.error) ? te(res.error) : te("generic"));
        return;
      }
      setErrors({});
      toast.success(t("saved"));
      onSaved({ ...block, data, isActive: active });
    });
  };

  return (
    <form onSubmit={save} className="space-y-4 border-t-2 border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="tablist">
          {(["uk", "ru", "en"] as const).map((l) => (
            <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)} className={cn("rounded-full border-2 px-3 py-1 text-xs font-bold", lang === l ? "border-ink bg-ink text-white" : "border-line")}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} /> {t("visible")}
        </label>
      </div>
      {FIELDS[block.type].map((f) => {
        const id = `${block.key}-${f.name}-${f.localized ? lang : ""}`;
        const errKey = f.localized ? `${f.name}.${lang}` : f.name;
        const value = f.localized ? ((data[f.name] as L3 | undefined)?.[lang] ?? "") : String(data[f.name] ?? "");
        const onChange = (v: string) =>
          setData((d) => (f.localized ? { ...d, [f.name]: { ...((d[f.name] as L3) ?? { uk: "", ru: "", en: "" }), [lang]: v } } : { ...d, [f.name]: v }));
        return (
          <Field key={f.name} label={`${t(`fields.${f.name}`)}${f.localized ? ` (${lang.toUpperCase()})` : ""}`} htmlFor={id} error={errors[errKey] ? (te.has(errors[errKey]) ? te(errors[errKey]) : errors[errKey]) : undefined}>
            {f.long ? (
              <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} maxLength={400} />
            ) : (
              <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={f.localized ? 400 : 300} className={f.localized ? "" : "font-mono text-sm"} />
            )}
          </Field>
        );
      })}
      <Button type="submit" loading={pending}>
        {tc("save")}
      </Button>
    </form>
  );
}

function SettingsForm({ initial }: { initial: { freeShippingEnabled: boolean; freeShippingThreshold: number } }) {
  const t = useTranslations("admin.cms");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const [enabled, setEnabled] = React.useState(initial.freeShippingEnabled);
  const [threshold, setThreshold] = React.useState(String(initial.freeShippingThreshold / 100));
  const [pending, start] = React.useTransition();
  return (
    <form
      className="space-y-4 rounded-xl border-2 border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSettingsAction({ freeShippingEnabled: enabled, freeShippingThreshold: threshold });
          if (res.ok) toast.success(t("saved"));
          else toast.error(te("validation"));
        });
      }}
    >
      <h2 className="font-display text-lg font-bold">{t("settings")}</h2>
      <label className="flex items-center gap-3 font-semibold">
        <Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> {t("freeShippingEnabled")}
      </label>
      <Field label={t("freeShippingThreshold")} htmlFor="fs-threshold">
        <Input id="fs-threshold" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} disabled={!enabled} />
      </Field>
      <Button type="submit" loading={pending}>
        {tc("save")}
      </Button>
    </form>
  );
}

function CategoriesForm({ initial }: { initial: { id: string; name: string; showOnHome: boolean }[] }) {
  const t = useTranslations("admin.cms");
  const tc = useTranslations("common");
  const [cats, setCats] = React.useState(initial);
  const [pending, start] = React.useTransition();
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cats.length) return;
    const n = [...cats];
    [n[i], n[j]] = [n[j], n[i]];
    setCats(n);
  };
  return (
    <form
      className="rounded-xl border-2 border-line bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveCategoryHomeAction(cats.map((c, i) => ({ id: c.id, showOnHome: c.showOnHome, sortOrder: i })));
          if (res.ok) toast.success(t("saved"));
        });
      }}
    >
      <h2 className="font-display text-lg font-bold">{t("categoriesTitle")}</h2>
      <p className="mb-3 text-xs text-muted">{t("categoriesHint")}</p>
      <ul className="space-y-1">
        {cats.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 py-1 text-sm font-semibold">
              <Checkbox checked={c.showOnHome} onChange={(e) => setCats(cats.map((x) => (x.id === c.id ? { ...x, showOnHome: e.target.checked } : x)))} />
              {c.name}
            </label>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-7 place-items-center rounded-full hover:bg-ink/5 disabled:opacity-30" aria-label={`${t("moveUp")}: ${c.name}`}>
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="grid size-7 place-items-center rounded-full hover:bg-ink/5 disabled:opacity-30" aria-label={`${t("moveDown")}: ${c.name}`}>
              <ArrowDown className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t("featuredHint")}</p>
      <Button type="submit" className="mt-3" loading={pending}>
        {tc("save")}
      </Button>
    </form>
  );
}
