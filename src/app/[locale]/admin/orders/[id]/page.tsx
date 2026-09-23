import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { OrderStatusControl } from "@/features/admin/orders/status-control";
import { formatOrderNumber, STATUS_TONE } from "@/features/orders/status";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

export default async function AdminOrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: raw, id } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const user = await requireAdminPage("orders:read");
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "desc" } }, promoCode: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const [t, ts, tp, tco, tc, format] = await Promise.all([
    getTranslations("admin.orders"),
    getTranslations("orderStatus"),
    getTranslations("paymentStatus"),
    getTranslations("checkout"),
    getTranslations("cart"),
    getFormatter(),
  ]);

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("title")}
      </Link>
      <AdminPageHeader
        title={t("details", { number: formatOrderNumber(order.number) })}
        description={format.dateTime(order.createdAt, { dateStyle: "long", timeStyle: "short" })}
        actions={
          <>
            <Badge variant={STATUS_TONE[order.status]}>{ts(order.status)}</Badge>
            <Badge variant={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "FAILED" ? "error" : "neutral"}>{tp(order.paymentStatus)}</Badge>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-xl border-2 border-line bg-white p-5">
            <h2 className="mb-3 font-display font-bold">{t("items")}</h2>
            <ul className="divide-y divide-line">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-cream-100">
                    {it.imageUrl && <ProductImage src={it.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {it.productId ? (
                      <Link href={`/admin/products/${it.productId}`} className="font-semibold hover:underline">
                        {it.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{it.name}</span>
                    )}
                    <span className="block text-xs text-muted">
                      {it.variantName ? `${it.variantName} · ` : ""}
                      {it.quantity} × {formatPrice(it.unitPrice, locale)}
                    </span>
                  </span>
                  <span className="font-bold tabular-nums">{formatPrice(it.total, locale)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t-2 border-line pt-3 text-sm">
              <Row k={tc("subtotal")} v={formatPrice(order.subtotal, locale)} />
              {order.discount > 0 && <Row k={`${tc("discount")} ${order.promoCode ? `(${order.promoCode.code})` : ""}`} v={`−${formatPrice(order.discount, locale)}`} />}
              <Row k={tco("deliveryFee")} v={formatPrice(order.deliveryFee, locale)} />
              <Row k={tc("total")} v={formatPrice(order.total, locale)} strong />
            </dl>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border-2 border-line bg-white p-5 text-sm">
              <h2 className="mb-3 font-display font-bold">{t("contact")}</h2>
              <p className="font-semibold">
                {order.firstName} {order.lastName}
              </p>
              <p>
                <a href={`tel:${order.phone}`} className="text-coral-700 hover:underline">
                  {order.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${order.email}`} className="text-coral-700 hover:underline">
                  {order.email}
                </a>
              </p>
              {!order.userId && <p className="mt-1 text-xs text-muted">{t("guest")}</p>}
            </section>
            <section className="rounded-xl border-2 border-line bg-white p-5 text-sm">
              <h2 className="mb-3 font-display font-bold">{t("delivery")}</h2>
              <p className="font-semibold">{tco(`methods.${order.deliveryMethod}`)}</p>
              <p>
                {order.city}
                {order.deliveryBranch && `, ${order.deliveryBranch}`}
                {order.deliveryAddress && `, ${order.deliveryAddress}`}
              </p>
              <p className="mt-2 font-semibold">{tco(`paymentMethods.${order.paymentMethod}`)}</p>
              {order.payments.map((p) => (
                <p key={p.id} className="text-xs text-muted">
                  {p.provider} · {p.providerRef} · {tp(p.status)}
                </p>
              ))}
            </section>
          </div>
          {order.comment && (
            <section className="rounded-xl border-2 border-line bg-white p-5 text-sm">
              <h2 className="mb-2 font-display font-bold">{t("comment")}</h2>
              <p className="whitespace-pre-line">{order.comment}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {hasPermission(user.permissions, "orders:write") && (
            <section className="rounded-xl border-2 border-ink bg-white p-5">
              <OrderStatusControl orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
            </section>
          )}
          <section className="rounded-xl border-2 border-line bg-white p-5">
            <h2 className="mb-3 font-display font-bold">{t("history")}</h2>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {order.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-coral-500" aria-hidden="true" />
                  <p className="font-semibold">{e.status ? ts(e.status) : e.message}</p>
                  {e.status && e.message && !e.message.startsWith("Status →") && <p className="text-muted">{e.message}</p>}
                  <p className="text-xs text-muted">{format.dateTime(e.createdAt, { dateStyle: "short", timeStyle: "short" })}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-1 font-display text-lg font-bold" : ""}`}>
      <dt className={strong ? "" : "text-muted"}>{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  );
}
