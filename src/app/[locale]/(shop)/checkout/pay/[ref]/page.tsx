import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { formatOrderNumber } from "@/features/orders/status";
import { simulateMockPaymentAction } from "@/features/orders/actions";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

/** MockPaymentProvider "hosted payment page". Only exists for mock payments. */
export default async function MockPayPage({ params }: { params: Promise<{ locale: string; ref: string }> }) {
  const { locale: raw, ref } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const payment = await db.payment.findUnique({ where: { providerRef: ref }, include: { order: true } });
  if (!payment || payment.provider !== "mock") notFound();
  const t = await getTranslations("checkout");
  const tc = await getTranslations("common");

  return (
    <div className="container-page max-w-lg py-12 md:py-20">
      <div className="rounded-2xl border-2 border-ink bg-white p-6 shadow-pop md:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-sm font-bold text-warning">
          <FlaskConical className="size-4" aria-hidden="true" /> {tc("testMode")}
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold">{t("payTitle")}</h1>
        <p className="mt-3 text-muted">{t("payNotice")}</p>
        <dl className="mt-6 space-y-2 rounded-xl bg-cream-100 p-4">
          <div className="flex justify-between">
            <dt className="text-muted">{t("orderNumber")}</dt>
            <dd className="font-bold">{formatOrderNumber(payment.order.number)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("payAmount")}</dt>
            <dd className="font-display text-2xl font-bold">{formatPrice(payment.amount, locale)}</dd>
          </div>
        </dl>
        {payment.status === "PAID" ? (
          <p className="mt-6 font-bold text-success">{t("paid")}</p>
        ) : (
          <div className="mt-6 grid gap-3">
            <form action={simulateMockPaymentAction}>
              <input type="hidden" name="providerRef" value={ref} />
              <input type="hidden" name="outcome" value="success" />
              <Button type="submit" variant="accent" size="lg" className="w-full">
                {t("paySuccess")}
              </Button>
            </form>
            <form action={simulateMockPaymentAction}>
              <input type="hidden" name="providerRef" value={ref} />
              <input type="hidden" name="outcome" value="fail" />
              <Button type="submit" variant="outline" size="lg" className="w-full">
                {t("payFail")}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
