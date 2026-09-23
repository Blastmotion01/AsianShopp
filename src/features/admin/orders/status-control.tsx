"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import { STATUS_TRANSITIONS } from "@/features/orders/status";
import { changeOrderStatusAction, markOrderPaidAction } from "./actions";

export function OrderStatusControl({ orderId, status, paymentStatus }: { orderId: string; status: OrderStatus; paymentStatus: PaymentStatus }) {
  const t = useTranslations("admin.orders");
  const ts = useTranslations("orderStatus");
  const te = useTranslations("errors");
  const router = useRouter();
  const options = STATUS_TRANSITIONS[status];
  const [next, setNext] = React.useState<OrderStatus | "">(options[0] ?? "");
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();

  const apply = () =>
    start(async () => {
      if (!next) return;
      const res = await changeOrderStatusAction({ orderId, status: next, note: note || undefined });
      if (res.ok) {
        toast.success(t("statusUpdated"));
        setNote("");
        router.refresh();
      } else toast.error(te.has(res.error) ? te(res.error) : te("generic"));
    });

  const markPaid = () =>
    start(async () => {
      const res = await markOrderPaidAction(orderId);
      if (res.ok) router.refresh();
      else toast.error(te("generic"));
    });

  return (
    <div className="space-y-3">
      {options.length > 0 ? (
        <>
          <label htmlFor="next-status" className="block text-sm font-bold">
            {t("changeStatus")}
          </label>
          <Select id="next-status" value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>
            {options.map((o) => (
              <option key={o} value={o}>
                {ts(o)}
              </option>
            ))}
          </Select>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("comment")} maxLength={300} aria-label={t("comment")} />
          {next === "CANCELLED" && <p className="text-xs font-semibold text-warning">{t("cancelNote")}</p>}
          <Button onClick={apply} loading={pending} className="w-full" variant={next === "CANCELLED" ? "danger" : "primary"}>
            {t("changeStatus")}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">{ts(status)}</p>
      )}
      {paymentStatus !== "PAID" && status !== "CANCELLED" && (
        <Button variant="outline" onClick={markPaid} disabled={pending} className="w-full">
          {t("markPaid")}
        </Button>
      )}
    </div>
  );
}
