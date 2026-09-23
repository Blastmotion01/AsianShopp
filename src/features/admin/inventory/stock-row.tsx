"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { setStockAction } from "./actions";

/** Inline stock editor: ± buttons or type a value, then save. */
export function StockEditor({ variantId, quantity, label }: { variantId: string; quantity: number; label: string }) {
  const t = useTranslations("admin.inventory");
  const te = useTranslations("errors");
  const router = useRouter();
  const [value, setValue] = React.useState(String(quantity));
  const [pending, start] = React.useTransition();
  const dirty = value !== String(quantity);
  const num = Math.max(0, Math.floor(Number(value) || 0));

  const save = () =>
    start(async () => {
      const res = await setStockAction({ variantId, quantity: num });
      if (res.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else toast.error(te.has(res.error) ? te(res.error) : te("generic"));
    });

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty) save();
      }}
    >
      <button type="button" onClick={() => setValue(String(Math.max(0, num - 1)))} className="grid size-8 place-items-center rounded-full border-2 border-line hover:border-ink" aria-label={`${label} −1`}>
        <Minus className="size-3.5" />
      </button>
      <label className="sr-only" htmlFor={`stock-${variantId}`}>
        {label}
      </label>
      <input
        id={`stock-${variantId}`}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
        className="h-9 w-16 rounded-md border-2 border-line text-center font-bold tabular-nums outline-none focus:border-ink"
      />
      <button type="button" onClick={() => setValue(String(num + 1))} className="grid size-8 place-items-center rounded-full border-2 border-line hover:border-ink" aria-label={`${label} +1`}>
        <Plus className="size-3.5" />
      </button>
      <Button type="submit" size="sm" variant={dirty ? "accent" : "ghost"} disabled={!dirty} loading={pending}>
        {t("set")}
      </Button>
    </form>
  );
}
