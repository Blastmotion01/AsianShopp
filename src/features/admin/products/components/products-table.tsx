"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";
import { bulkUpdateProductsAction, deleteProductsAction, duplicateProductAction } from "../actions";

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  category: string;
  country: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  skus: string;
};

export function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const t = useTranslations("admin.products");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, start] = React.useTransition();
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const run = (fn: () => Promise<void>) => start(async () => {
    await fn();
    router.refresh();
  });

  const bulk = (op: "activate" | "deactivate" | "feature") =>
    run(async () => {
      const res = await bulkUpdateProductsAction({ ids: [...selected], op });
      if (res.ok) toast.success(t("updated", { count: res.data.updated }));
      else toast.error(te.has(res.error) ? te(res.error) : te("generic"));
      setSelected(new Set());
    });

  const remove = (ids: string[], confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    run(async () => {
      const res = await deleteProductsAction(ids);
      if (!res.ok) return void toast.error(te.has(res.error) ? te(res.error) : te("generic"));
      if (res.data.deleted) toast.success(t("deleted", { count: res.data.deleted }));
      if (res.data.skipped) toast.warning(t("skipped", { count: res.data.skipped }));
      setSelected(new Set());
    });
  };

  const duplicate = (id: string) =>
    run(async () => {
      const res = await duplicateProductAction(id);
      if (res.ok) {
        toast.success(t("duplicated"));
        router.push(`/admin/products/${res.data.id}`);
      } else toast.error(te("generic"));
    });

  return (
    <div className="overflow-hidden rounded-xl border-2 border-line bg-white">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-line bg-cream-100 px-4 py-3 text-sm">
          <span className="font-bold">{t("selected", { count: selected.size })}</span>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => bulk("activate")}>
            {t("bulkActivate")}
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => bulk("deactivate")}>
            {t("bulkDeactivate")}
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => bulk("feature")}>
            {t("bulkFeature")}
          </Button>
          <Button size="sm" variant="danger" disabled={pending} onClick={() => remove([...selected], t("confirmBulkDelete"))}>
            {t("bulkDelete")}
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm" aria-busy={pending}>
          <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                  aria-label={tc("all")}
                />
              </th>
              <th className="px-2 py-3">{t("name")}</th>
              <th className="px-2 py-3">{t("price")}</th>
              <th className="px-2 py-3">{t("stock")}</th>
              <th className="px-2 py-3">{t("status")}</th>
              <th className="px-4 py-3 text-right">{tc("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? "bg-pink-50" : "hover:bg-cream-50"}>
                <td className="px-4 py-3">
                  <Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={r.name} />
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-cream-100">
                      {r.image && <ProductImage src={r.image} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <Link href={`/admin/products/${r.id}`} className="block truncate font-semibold hover:underline">
                        {r.name}
                      </Link>
                      <span className="block truncate text-xs text-muted">
                        {r.category}
                        {r.country ? ` · ${r.country}` : ""} · {r.skus}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3 font-semibold tabular-nums">{formatPrice(r.price, locale)}</td>
                <td className="px-2 py-3">
                  <Badge variant={r.stock === 0 ? "error" : r.stock <= 5 ? "warning" : "success"} size="sm">
                    {r.stock}
                  </Badge>
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={r.isActive ? "success" : "neutral"} size="sm">
                      {r.isActive ? t("active") : t("inactive")}
                    </Badge>
                    {r.isFeatured && (
                      <Badge variant="NEW" size="sm">
                        ★
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <IconLink href={`/admin/products/${r.id}`} label={tc("edit")}>
                      <Pencil className="size-4" />
                    </IconLink>
                    <IconBtn onClick={() => duplicate(r.id)} label={t("duplicate")} disabled={pending}>
                      <Copy className="size-4" />
                    </IconBtn>
                    {r.isActive && (
                      <a href={`/${locale === "uk" ? "" : `${locale}/`}products/${r.slug}`} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full hover:bg-ink/5" aria-label={t("view")} title={t("view")}>
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <IconBtn onClick={() => remove([r.id], t("confirmDelete"))} label={tc("delete")} disabled={pending} danger>
                      <Trash2 className="size-4" />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconBtn({ onClick, label, children, disabled, danger }: { onClick: () => void; label: string; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-full disabled:opacity-40 ${danger ? "hover:bg-error-soft hover:text-error" : "hover:bg-ink/5"}`}
    >
      {children}
    </button>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className="grid size-9 place-items-center rounded-full hover:bg-ink/5">
      {children}
    </Link>
  );
}
