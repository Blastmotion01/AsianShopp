"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatPrice, toMinor } from "@/lib/money";
import type { Locale } from "@/config/site";
import { weightedAverageCost } from "./costing";
import { receiveStockAction } from "./actions";

export function ReceiveStockDialog({
  variantId,
  productName,
  stock,
  costPrice,
}: {
  variantId: string;
  productName: string;
  stock: number;
  /** current weighted-average cost, minor units */
  costPrice: number | null;
}) {
  const t = useTranslations("admin.inventory");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const tv = useTranslations("validation");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [qty, setQty] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [note, setNote] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, start] = React.useTransition();

  const qtyNum = Math.floor(Number(qty));
  const costMinor = toMinor(cost);
  const valid = qtyNum > 0 && Number.isFinite(costMinor) && costMinor >= 0;
  const preview = valid ? weightedAverageCost(stock, costPrice, qtyNum, costMinor) : null;

  function openDialog() {
    setQty("");
    setCost(costPrice !== null ? String(costPrice / 100) : "");
    setNote("");
    setErrors({});
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await receiveStockAction({ variantId, quantity: qty, unitCost: cost, note });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(te.has(res.error) ? te(res.error) : te("generic"));
        return;
      }
      toast.success(t("received", { stock: res.data.stockAfter, cost: formatPrice(res.data.costAfter, locale) }));
      setOpen(false);
      router.refresh();
    });
  }

  const err = (k: string) => (errors[k] ? (tv.has(errors[k]) ? tv(errors[k]) : tv("invalid")) : undefined);

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={openDialog}>
        <PackagePlus aria-hidden="true" /> {t("receive")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={tc("close")} aria-describedby={undefined}>
          <DialogTitle className="font-display text-xl font-bold">{t("receiveTitle")}</DialogTitle>
          <p className="mt-1 text-sm text-muted">{productName}</p>
          <form onSubmit={submit} className="mt-5 grid gap-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("receiveQty")} htmlFor={`rq-${variantId}`} error={err("quantity")}>
                <Input id={`rq-${variantId}`} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))} autoFocus />
              </Field>
              <Field label={t("receiveCost")} htmlFor={`rc-${variantId}`} error={err("unitCost")}>
                <Input id={`rc-${variantId}`} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
              </Field>
            </div>
            <Field label={t("receiveNote")} htmlFor={`rn-${variantId}`}>
              <Input id={`rn-${variantId}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder={t("receiveNotePlaceholder")} />
            </Field>

            <dl className="grid grid-cols-2 gap-2 rounded-lg bg-cream-100 p-3 text-sm">
              <dt className="text-muted">{t("now")}</dt>
              <dd className="text-right font-semibold">
                {stock} {t("pcs")} · {costPrice !== null ? formatPrice(costPrice, locale) : "—"}
              </dd>
              <dt className="text-muted">{t("after")}</dt>
              <dd className="text-right font-bold">
                {valid ? `${stock + qtyNum} ${t("pcs")} · ${formatPrice(preview!, locale)}` : "—"}
              </dd>
            </dl>
            <p className="-mt-2 text-xs text-muted">{t("avgHint")}</p>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" variant="accent" loading={pending} disabled={!valid}>
                {t("receiveSubmit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
