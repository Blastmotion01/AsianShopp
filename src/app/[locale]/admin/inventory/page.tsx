import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { pickLocalized } from "@/lib/localized";
import { formatPrice } from "@/lib/money";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ListToolbar } from "@/features/admin/components/list-toolbar";
import { StockEditor } from "@/features/admin/inventory/stock-row";
import { ReceiveStockDialog } from "@/features/admin/inventory/receive-dialog";
import { markupPercent } from "@/features/admin/inventory/costing";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/config/site";

export default async function AdminInventoryPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; status?: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("inventory:write");
  const sp = await searchParams;
  const [t, format] = await Promise.all([getTranslations("admin.inventory"), getFormatter()]);
  const q = sp.q?.trim().slice(0, 80);

  const where: Prisma.ProductVariantWhereInput = {
    ...(q
      ? { OR: [{ sku: { contains: q, mode: "insensitive" } }, { product: { translations: { some: { name: { contains: q, mode: "insensitive" } } } } }] }
      : {}),
    ...(sp.status === "out" ? { inventory: { quantity: { lte: 0 } } } : {}),
    ...(sp.status === "low" ? { inventory: { quantity: { gt: 0, lte: 5 } } } : {}),
    ...(sp.status === "in" ? { inventory: { quantity: { gt: 5 } } } : {}),
    ...(sp.status === "nocost" ? { costPrice: null } : {}),
  };

  const [variants, allStock, receipts] = await Promise.all([
    db.productVariant.findMany({
      where,
      include: { inventory: true, product: { include: { translations: { where: { locale: { in: [locale, "uk"] } } } } } },
      orderBy: [{ inventory: { quantity: "asc" } }, { sku: "asc" }],
      take: 300,
    }),
    // Totals across the whole warehouse (small catalog → computed in JS)
    db.productVariant.findMany({ select: { price: true, costPrice: true, inventory: { select: { quantity: true } } } }),
    db.stockReceipt.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { variant: { include: { product: { include: { translations: { where: { locale: { in: [locale, "uk"] } } } } } } } },
    }),
  ]);

  const totals = allStock.reduce(
    (acc, v) => {
      const qty = Math.max(0, v.inventory?.quantity ?? 0);
      acc.units += qty;
      acc.retail += qty * v.price;
      if (v.costPrice === null) acc.noCost += qty > 0 ? 1 : 0;
      else acc.cost += qty * v.costPrice;
      return acc;
    },
    { units: 0, cost: 0, retail: 0, noCost: 0 },
  );
  const nameOf = (p: { slug: string; translations: { locale: string; name: string }[] }) =>
    (p.translations.find((x) => x.locale === locale) ?? p.translations[0])?.name ?? p.slug;

  return (
    <div>
      <AdminPageHeader title={t("title")} description={t("pageHint")} />

      <ul className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: t("totalUnits"), value: format.number(totals.units) },
          { label: t("totalCost"), value: formatPrice(totals.cost, locale), hint: totals.noCost > 0 ? t("noCostCount", { count: totals.noCost }) : undefined },
          { label: t("totalRetail"), value: formatPrice(totals.retail, locale) },
          { label: t("totalMargin"), value: formatPrice(totals.retail - totals.cost, locale) },
        ].map((k) => (
          <li key={k.label} className={`@container min-w-0 rounded-xl border-2 bg-white p-4 ${k.hint ? "border-warning" : "border-line"}`}>
            <p className="text-sm font-semibold text-muted">{k.label}</p>
            <p className="mt-1 font-display text-[clamp(1rem,10cqi,1.4rem)] font-extrabold whitespace-nowrap tabular-nums">{k.value}</p>
            {k.hint && <p className="mt-0.5 text-xs font-semibold text-warning">{k.hint}</p>}
          </li>
        ))}
      </ul>

      <ListToolbar
        current={{ q: sp.q, status: sp.status }}
        placeholder={t("searchPlaceholder")}
        selects={[
          {
            name: "status",
            label: t("status"),
            options: [
              { value: "", label: t("filterAll") },
              { value: "in", label: t("inStock") },
              { value: "low", label: t("lowStock") },
              { value: "out", label: t("outOfStock") },
              { value: "nocost", label: t("filterNoCost") },
            ],
          },
        ]}
      />
      <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">{t("product")}</th>
              <th className="px-2 py-3">{t("status")}</th>
              <th className="px-2 py-3 text-right">{t("salePrice")}</th>
              <th className="px-2 py-3 text-right">{t("costPrice")}</th>
              <th className="px-2 py-3 text-right">{t("markup")}</th>
              <th className="px-2 py-3">{t("stock")}</th>
              <th className="px-2 py-3 text-right">{t("stockValue")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {variants.map((v) => {
              const qty = v.inventory?.quantity ?? 0;
              const threshold = v.inventory?.lowStockThreshold ?? 5;
              const status = qty <= 0 ? "out" : qty <= threshold ? "low" : "in";
              const name = nameOf(v.product);
              const markup = markupPercent(v.price, v.costPrice);
              return (
                <tr key={v.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${v.productId}`} className="font-semibold hover:underline">
                      {name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {v.sku} · {pickLocalized(v.name, locale)}
                      {!v.product.isActive && " · ⏸"}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={status === "out" ? "error" : status === "low" ? "warning" : "success"} size="sm">
                      {status === "out" ? t("outOfStock") : status === "low" ? t("lowStock") : t("inStock")}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-right font-semibold tabular-nums">{formatPrice(v.price, locale)}</td>
                  <td className="px-2 py-3 text-right tabular-nums">
                    {v.costPrice !== null ? formatPrice(v.costPrice, locale) : <span className="font-semibold text-warning">{t("noCost")}</span>}
                  </td>
                  <td className={`px-2 py-3 text-right font-semibold tabular-nums ${markup !== null && markup < 0 ? "text-error" : ""}`}>
                    {markup !== null ? `${format.number(markup, { maximumFractionDigits: 0 })}%` : "—"}
                  </td>
                  <td className="px-2 py-3">
                    <StockEditor key={`${v.id}-${qty}`} variantId={v.id} quantity={qty} label={`${t("stock")}: ${v.sku}`} />
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-muted">{v.costPrice !== null ? formatPrice(Math.max(0, qty) * v.costPrice, locale) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <ReceiveStockDialog variantId={v.id} productName={`${name} · ${v.sku}`} stock={Math.max(0, qty)} costPrice={v.costPrice} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{t("correctionHint")}</p>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-bold">{t("historyTitle")}</h2>
        {receipts.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-line p-6 text-center text-sm text-muted">{t("historyEmpty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">{t("date")}</th>
                  <th className="px-2 py-3">{t("product")}</th>
                  <th className="px-2 py-3 text-right">{t("receiveQty")}</th>
                  <th className="px-2 py-3 text-right">{t("receiveCost")}</th>
                  <th className="px-2 py-3 text-right">{t("costChange")}</th>
                  <th className="px-2 py-3">{t("who")}</th>
                  <th className="px-4 py-3">{t("receiveNote")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">{format.dateTime(r.createdAt, { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="px-2 py-3">
                      <span className="font-semibold">{nameOf(r.variant.product)}</span>
                      <span className="block text-xs text-muted">{r.variant.sku}</span>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">
                      +{r.quantity} <span className="text-xs text-muted">({r.stockBefore} → {r.stockAfter})</span>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{formatPrice(r.unitCost, locale)}</td>
                    <td className="px-2 py-3 text-right whitespace-nowrap tabular-nums">
                      {r.costBefore !== null ? formatPrice(r.costBefore, locale) : "—"} → <b>{formatPrice(r.costAfter, locale)}</b>
                    </td>
                    <td className="px-2 py-3">{r.userName}</td>
                    <td className="px-4 py-3 text-muted">{r.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
