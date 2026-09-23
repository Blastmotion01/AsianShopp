import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { formatOrderNumber } from "@/features/orders/status";
import { retryPaymentAction } from "@/features/orders/actions";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export default async function OrderSuccessPage({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  const { locale: raw, orderId } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  // cuid ids are unguessable; the page shows only non-sensitive data (masked email).
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) notFound();
  const user = await getCurrentUser();
  const t = await getTranslations("checkout");
  const tp = await getTranslations("paymentStatus");
  const number = formatOrderNumber(order.number);
  const paymentFailed = order.paymentMethod === "CARD_ONLINE" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";

  return (
    <div className="container-page max-w-2xl py-12 text-center md:py-20">
      {paymentFailed && order.paymentStatus === "FAILED" ? (
        <XCircle className="mx-auto size-20 text-error" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mx-auto size-20 text-success" aria-hidden="true" />
      )}
      <h1 className="mt-6 font-display text-3xl font-extrabold md:text-5xl">
        {paymentFailed && order.paymentStatus === "FAILED" ? t("paymentFailedTitle") : t("successTitle")}
      </h1>
      <p className="mt-4 text-lg text-muted">
        {paymentFailed && order.paymentStatus === "FAILED" ? t("paymentFailedText") : t("successText", { email: maskEmail(order.email) })}
      </p>

      <div className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl border-2 border-ink bg-white p-6 text-left shadow-pop">
        <div className="flex justify-between">
          <span className="text-muted">{t("orderNumber")}</span>
          <span className="font-display font-bold">{number}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("summary")}</span>
          <span className="font-display font-bold">{formatPrice(order.total, locale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t("payment")}</span>
          <span className="font-semibold">
            {t(`paymentMethods.${order.paymentMethod}`)} · {tp(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {paymentFailed && (
          <form action={retryPaymentAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" variant="accent" size="lg">
              {t("retryPay")}
            </Button>
          </form>
        )}
        {user && order.userId === user.id && (
          <Button asChild variant="outline" size="lg">
            <Link href={`/account/orders/${order.id}`}>{t("viewOrder")}</Link>
          </Button>
        )}
        <Button asChild variant={paymentFailed ? "ghost" : "accent"} size="lg">
          <Link href="/products">{t("backToShop")}</Link>
        </Button>
      </div>
    </div>
  );
}
