"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/misc";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";
import { deletePromoAction, savePromoAction } from "./actions";

export type PromoRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  isActive: boolean;
  description: string | null;
};

type FormState = {
  id?: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrder: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
  description: string;
};

const EMPTY: FormState = { code: "", type: "PERCENTAGE", value: "10", minOrder: "", startsAt: "", endsAt: "", usageLimit: "", perUserLimit: "", isActive: true, description: "" };
const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function PromoManager({ rows }: { rows: PromoRow[] }) {
  const t = useTranslations("admin.promocodes");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();
  const err = (k: string) => (errors[k] ? (tv.has(errors[k]) ? tv(errors[k]) : te.has(errors[k]) ? te(errors[k]) : tv("invalid")) : undefined);

  const edit = (r?: PromoRow) => {
    setErrors({});
    setForm(
      r
        ? {
            id: r.id,
            code: r.code,
            type: r.type,
            value: String(r.type === "FIXED" ? r.value / 100 : r.value),
            minOrder: r.minOrder !== null ? String(r.minOrder / 100) : "",
            startsAt: toLocalInput(r.startsAt),
            endsAt: toLocalInput(r.endsAt),
            usageLimit: r.usageLimit?.toString() ?? "",
            perUserLimit: r.perUserLimit?.toString() ?? "",
            isActive: r.isActive,
            description: r.description ?? "",
          }
        : EMPTY,
    );
    setOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await savePromoAction({
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(te.has(res.error) ? te(res.error) : te("generic"));
        return;
      }
      toast.success(t("saved"));
      setOpen(false);
      router.refresh();
    });
  };

  const remove = (r: PromoRow) => {
    if (!window.confirm(t("confirmDelete"))) return;
    start(async () => {
      const res = await deletePromoAction(r.id);
      if (res.ok) {
        toast.success(t("deleted"));
        router.refresh();
      } else toast.error(te("generic"));
    });
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale) : "—");

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="accent" onClick={() => edit()}>
          <Plus aria-hidden="true" /> {t("new")}
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState emoji="🎟️" title={t("noCodes")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3">{t("code")}</th>
                <th className="px-2 py-3">{t("value")}</th>
                <th className="px-2 py-3">{t("minOrder")}</th>
                <th className="px-2 py-3">
                  {t("startsAt")} – {t("endsAt")}
                </th>
                <th className="px-2 py-3">{t("used")}</th>
                <th className="px-2 py-3">{t("active")}</th>
                <th className="px-4 py-3 text-right">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold">{r.code}</span>
                    {r.description && <span className="block text-xs text-muted">{r.description}</span>}
                  </td>
                  <td className="px-2 py-3 font-semibold">{r.type === "PERCENTAGE" ? `${r.value}%` : formatPrice(r.value, locale)}</td>
                  <td className="px-2 py-3">{r.minOrder ? formatPrice(r.minOrder, locale) : "—"}</td>
                  <td className="px-2 py-3 text-muted">
                    {fmtDate(r.startsAt)} – {fmtDate(r.endsAt)}
                  </td>
                  <td className="px-2 py-3 tabular-nums">
                    {r.usedCount} / {r.usageLimit ?? t("unlimited")}
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={r.isActive ? "success" : "neutral"} size="sm">
                      {r.isActive ? tc("yes") : tc("no")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => edit(r)} className="grid size-9 place-items-center rounded-full hover:bg-ink/5" aria-label={tc("edit")}>
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" onClick={() => remove(r)} disabled={pending} className="grid size-9 place-items-center rounded-full hover:bg-error-soft hover:text-error" aria-label={tc("delete")}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={tc("close")} aria-describedby={undefined}>
          <DialogTitle className="mb-5 font-display text-xl font-bold">{form.id ? form.code : t("new")}</DialogTitle>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label={t("code")} htmlFor="pc-code" error={err("code")} className="sm:col-span-2">
              <Input id="pc-code" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="font-mono font-bold" maxLength={40} />
            </Field>
            <Field label={t("type")} htmlFor="pc-type">
              <Select id="pc-type" value={form.type} onChange={(e) => set("type", e.target.value as FormState["type"])}>
                <option value="PERCENTAGE">{t("PERCENTAGE")}</option>
                <option value="FIXED">{t("FIXED")}</option>
              </Select>
            </Field>
            <Field label={t("value")} htmlFor="pc-value" hint={t("valueHint")} error={err("value")}>
              <Input id="pc-value" inputMode="decimal" value={form.value} onChange={(e) => set("value", e.target.value)} />
            </Field>
            <Field label={t("minOrder")} htmlFor="pc-min" error={err("minOrder")}>
              <Input id="pc-min" inputMode="decimal" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} />
            </Field>
            <Field label={t("usageLimit")} htmlFor="pc-limit" error={err("usageLimit")}>
              <Input id="pc-limit" inputMode="numeric" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="∞" />
            </Field>
            <Field label={t("startsAt")} htmlFor="pc-start" error={err("startsAt")}>
              <Input id="pc-start" type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label={t("endsAt")} htmlFor="pc-end" error={err("endsAt")}>
              <Input id="pc-end" type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
            <Field label={t("perUserLimit")} htmlFor="pc-user" error={err("perUserLimit")}>
              <Input id="pc-user" inputMode="numeric" value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} placeholder="∞" />
            </Field>
            <Field label={t("description")} htmlFor="pc-desc">
              <Input id="pc-desc" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={200} />
            </Field>
            <label className="flex items-center gap-3 font-semibold sm:col-span-2">
              <Checkbox checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> {t("active")}
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" variant="accent" loading={pending}>
                {tc("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
