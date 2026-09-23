import { notFound } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getOrderForUser } from "@/features/orders/service";
import { formatOrderNumber, STATUS_TONE, ORDER_STATUSES } from "@/features/orders/status";
import { retryPaymentAction } from "@/features/orders/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/site";

export default async function AccountOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const user = await requireUserPage(`/account/orders/${id}`);
  const order = await getOrderForUser(id, user.id);
  if (!order) notFound();
  const [t, ts, tp, tco, tc, format] = await Promise.all([
    getTranslations("account"),
    getTranslations("orderStatus"),
    getTranslations("paymentStatus"),
    getTranslations("checkout"),
    getTranslations("cart"),
    getFormatter(),
  ]);
  const progress: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== "CANCELLED");
  const currentIdx = progress.indexOf(order.status);
  const canPay = order.paymentMethod === "CARD_ONLINE" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("backToOrders")}
      </Link>

      <section className="rounded-2xl border-2 border-line bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">{t("order", { number: formatOrderNumber(order.number) })}</h2>
            <p className="text-sm text-muted">{format.dateTime(order.createdAt, { dateStyle: "long", timeStyle: "short" })}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={STATUS_TONE[order.status]}>{ts(order.status)}</Badge>
            <Badge variant={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "FAILED" ? "error" : "neutral"}>{tp(order.paymentStatus)}</Badge>
          </div>
        </div>

        {order.status !== "CANCELLED" && (
          <ol className="mt-6 grid grid-cols-5 gap-1" aria-label={t("status")}>
            {progress.map((s, i) => (
              <li key={s} className="text-center">
                <span className={cn("block h-2 rounded-full", i <= currentIdx ? "bg-coral-500" : "bg-line")} />
                <span className={cn("mt-2 block text-[0.7rem] font-semibold md:text-xs", i <= currentIdx ? "text-ink" : "text-muted")}>{ts(s)}</span>
              </li>
            ))}
          </ol>
        )}

        {canPay && (
          <form action={retryPaymentAction} className="mt-6">
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" variant="accent">
              {tco("retryPay")}
            </Button>
          </form>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border-2 border-line bg-white p-5">
          <h3 className="mb-3 font-display font-bold">{t("delivery")}</h3>
          <p className="font-semibold">{tco(`methods.${order.deliveryMethod}`)}</p>
          <p className="text-muted">
            {order.city}
            {order.deliveryBranch && `, ${order.deliveryBranch}`}
            {order.deliveryAddress && `, ${order.deliveryAddress}`}
          </p>
          <p className="mt-2 text-muted">
            {order.firstName} {order.lastName} · {order.phone}
          </p>
        </section>
        <section className="rounded-2xl border-2 border-line bg-white p-5">
          <h3 className="mb-3 font-display font-bold">{t("payment")}</h3>
          <p className="font-semibold">{tco(`paymentMethods.${order.paymentMethod}`)}</p>
          <p className="text-muted">{tp(order.paymentStatus)}</p>
        </section>
      </div>

      <section className="rounded-2xl border-2 border-line bg-white p-5 md:p-7">
        <h3 className="mb-4 font-display font-bold">{t("items")}</h3>
        <ul className="divide-y divide-line">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-4 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-cream-100">
                {it.imageUrl && <ProductImage src={it.imageUrl} alt={it.name} fill sizes="56px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{it.name}</span>
                <span className="text-sm text-muted">
                  {it.variantName ? `${it.variantName} · ` : ""}
                  {it.quantity} × {formatPrice(it.unitPrice, locale)}
                </span>
              </span>
              <span className="font-bold">{formatPrice(it.total, locale)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t-2 border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("subtotal")}</dt>
            <dd className="font-semibold">{formatPrice(order.subtotal, locale)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-coral-700">
              <dt>
                {tc("discount")} {order.promoCode ? `(${order.promoCode.code})` : ""}
              </dt>
              <dd className="font-semibold">−{formatPrice(order.discount, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">{tco("deliveryFee")}</dt>
            <dd className="font-semibold">{order.deliveryFee === 0 ? tco("free") : formatPrice(order.deliveryFee, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-display text-lg font-bold">{tc("total")}</dt>
            <dd className="font-display text-2xl font-bold">{formatPrice(order.total, locale)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
