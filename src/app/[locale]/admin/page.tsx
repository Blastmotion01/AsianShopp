import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Banknote, ShoppingCart, Receipt, Package, Users, AlertTriangle, TrendingUp, Percent } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/guards";
import { getDashboardData } from "@/features/admin/dashboard";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { RankedBars, TimeSeriesChart } from "@/features/admin/components/charts";
import { formatOrderNumber, STATUS_TONE } from "@/features/orders/status";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("dashboard:read");
  const [t, tn, ts, format, data] = await Promise.all([
    getTranslations("admin.dashboard"),
    getTranslations("admin.nav"),
    getTranslations("orderStatus"),
    getFormatter(),
    getDashboardData(locale),
  ]);

  const kpis = [
    { label: t("revenue"), value: formatPrice(roundUah(data.kpi.revenue), locale), sub: t("last30"), icon: Banknote },
    {
      label: t("profit"),
      value: formatPrice(roundUah(data.kpi.profit), locale),
      sub: data.kpi.itemsWithoutCost > 0 ? t("missingCost", { count: data.kpi.itemsWithoutCost }) : t("profitHint"),
      icon: TrendingUp,
      warn: data.kpi.itemsWithoutCost > 0,
      href: data.kpi.itemsWithoutCost > 0 ? "/admin/products" : undefined,
    },
    {
      label: t("margin"),
      value: data.kpi.margin === null ? "—" : format.number(data.kpi.margin, { style: "percent", maximumFractionDigits: 1 }),
      sub: t("marginHint"),
      icon: Percent,
    },
    { label: t("orders"), value: format.number(data.kpi.orders), sub: t("last30"), icon: ShoppingCart },
    { label: t("avgOrder"), value: formatPrice(roundUah(data.kpi.avgOrder), locale), sub: t("last30"), icon: Receipt },
    { label: t("products"), value: format.number(data.kpi.products), icon: Package },
    { label: t("customers"), value: format.number(data.kpi.customers), icon: Users },
    { label: t("lowStock"), value: format.number(data.kpi.lowStock), icon: AlertTriangle, warn: data.kpi.lowStock > 0, href: "/admin/inventory?status=low" },
  ];

  return (
    <div>
      <AdminPageHeader title={tn("dashboard")} description={t("excludesCancelled")} />
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <>
              <div className="flex items-center justify-between text-sm font-semibold text-muted">
                {k.label}
                <k.icon className={`size-4 ${k.warn ? "text-warning" : "text-coral-600"}`} aria-hidden="true" />
              </div>
              {/* Font scales with the tile width (container query units), so long sums never overflow */}
              <p className="mt-2 font-display text-[clamp(1rem,11cqi,1.5rem)] font-extrabold whitespace-nowrap tabular-nums">{k.value}</p>
              {k.sub && <p className="mt-0.5 text-xs text-muted">{k.sub}</p>}
            </>
          );
          return (
            <li key={k.label} className={`@container min-w-0 rounded-xl border-2 bg-white p-4 ${k.warn ? "border-warning" : "border-line"}`}>
              {k.href ? <Link href={k.href}>{body}</Link> : body}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={t("revenueChart")}>
          <TimeSeriesChart data={data.daily} dataKey="revenue" kind="area" unit="₴" />
        </Panel>
        <Panel title={t("ordersChart")}>
          <TimeSeriesChart data={data.daily} dataKey="orders" kind="bar" />
        </Panel>
        <Panel title={t("byCategory")}>{data.byCategory.length ? <RankedBars data={data.byCategory} unit="₴" /> : <Empty text={t("noData")} />}</Panel>
        <Panel title={t("byCountry")}>{data.byCountry.length ? <RankedBars data={data.byCountry} unit="₴" /> : <Empty text={t("noData")} />}</Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={t("recentOrders")}>
          <ul className="divide-y divide-line">
            {data.recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-2.5 hover:bg-cream-50">
                  <span className="font-display text-sm font-bold">{formatOrderNumber(o.number)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {o.firstName} {o.lastName} · {format.dateTime(o.createdAt, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <Badge variant={STATUS_TONE[o.status]} size="sm">
                    {ts(o.status)}
                  </Badge>
                  <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(o.total, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t("lowStockList")}>
          {data.lowStock.length === 0 ? (
            <Empty text={t("noData")} />
          ) : (
            <ul className="divide-y divide-line">
              {data.lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${i.productId}`} className="min-w-0 truncate font-semibold hover:underline">
                    {i.name} <span className="font-normal text-muted">· {i.sku}</span>
                  </Link>
                  <Badge variant={i.quantity === 0 ? "error" : "warning"} size="sm">
                    {i.quantity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** KPI tiles show whole hryvnias — kopiykas add noise and overflow the tile. */
function roundUah(minor: number) {
  return Math.round(minor / 100) * 100;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border-2 border-line bg-white p-5">
      <h2 className="mb-4 font-display text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}
