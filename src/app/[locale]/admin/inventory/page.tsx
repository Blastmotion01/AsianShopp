import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { pickLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ListToolbar } from "@/features/admin/components/list-toolbar";
import { StockEditor } from "@/features/admin/inventory/stock-row";
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
  };

  const variants = await db.productVariant.findMany({
    where,
    include: { inventory: true, product: { include: { translations: { where: { locale: { in: [locale, "uk"] } } } } } },
    orderBy: [{ inventory: { quantity: "asc" } }, { sku: "asc" }],
    take: 300,
  });

  return (
    <div>
      <AdminPageHeader title={t("title")} />
      <ListToolbar
        current={{ q: sp.q, status: sp.status }}
        placeholder={t("sku")}
        selects={[
          {
            name: "status",
            label: t("status"),
            options: [
              { value: "", label: t("filterAll") },
              { value: "in", label: t("inStock") },
              { value: "low", label: t("lowStock") },
              { value: "out", label: t("outOfStock") },
            ],
          },
        ]}
      />
      <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">{t("product")}</th>
              <th className="px-2 py-3">{t("status")}</th>
              <th className="px-2 py-3">{t("stock")}</th>
              <th className="px-4 py-3">{t("updated")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {variants.map((v) => {
              const qty = v.inventory?.quantity ?? 0;
              const threshold = v.inventory?.lowStockThreshold ?? 5;
              const status = qty <= 0 ? "out" : qty <= threshold ? "low" : "in";
              const name = (v.product.translations.find((x) => x.locale === locale) ?? v.product.translations[0])?.name ?? v.product.slug;
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
                  <td className="px-2 py-3">
                    <StockEditor key={`${v.id}-${qty}`} variantId={v.id} quantity={qty} label={`${t("stock")}: ${v.sku}`} />
                  </td>
                  <td className="px-4 py-3 text-muted">{v.inventory ? format.dateTime(v.inventory.updatedAt, { dateStyle: "short", timeStyle: "short" }) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
