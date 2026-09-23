import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { requireUserPage } from "@/lib/auth/guards";
import { getUserOrders } from "@/features/orders/service";
import { formatOrderNumber, STATUS_TONE } from "@/features/orders/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ProductImage } from "@/components/product/product-image";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

export default async function AccountOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const user = await requireUserPage("/account/orders");
  const [t, ts, tp, tc, format] = await Promise.all([
    getTranslations("account"),
    getTranslations("orderStatus"),
    getTranslations("paymentStatus"),
    getTranslations("cart"),
    getFormatter(),
  ]);
  const orders = await getUserOrders(user.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        emoji="📦"
        title={t("noOrders")}
        text={t("noOrdersText")}
        action={
          <Button asChild variant="accent">
            <Link href="/products">{tc("continue")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="group block rounded-2xl border-2 border-line bg-white p-5 transition-colors hover:border-ink">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold">{t("order", { number: formatOrderNumber(o.number) })}</p>
                <p className="text-sm text-muted">{format.dateTime(o.createdAt, { dateStyle: "long", timeStyle: "short" })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_TONE[o.status]}>{ts(o.status)}</Badge>
                <Badge variant={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "FAILED" ? "error" : "neutral"}>{tp(o.paymentStatus)}</Badge>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex -space-x-3">
                {o.items.slice(0, 5).map((it) => (
                  <span key={it.id} className="relative size-12 overflow-hidden rounded-full border-2 border-white bg-cream-100 ring-1 ring-line">
                    {it.imageUrl && <ProductImage src={it.imageUrl} alt={it.name} fill sizes="48px" className="object-cover" />}
                  </span>
                ))}
                {o.items.length > 5 && <span className="grid size-12 place-items-center rounded-full border-2 border-white bg-ink text-xs font-bold text-white">+{o.items.length - 5}</span>}
              </div>
              <span className="flex items-center gap-2 font-display text-xl font-bold">
                {formatPrice(o.total, locale)}
                <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
