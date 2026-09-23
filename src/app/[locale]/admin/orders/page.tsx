import type { OrderStatus, Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ListToolbar } from "@/features/admin/components/list-toolbar";
import { formatOrderNumber, ORDER_STATUSES, parseOrderNumber, STATUS_TONE } from "@/features/orders/status";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

const PAGE = 25;

export default async function AdminOrdersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("orders:read");
  const sp = await searchParams;
  const [t, ta, ts, tp, tco, format] = await Promise.all([
    getTranslations("admin.orders"),
    getTranslations("admin"),
    getTranslations("orderStatus"),
    getTranslations("paymentStatus"),
    getTranslations("checkout"),
    getFormatter(),
  ]);
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim().slice(0, 80);
  const num = q ? parseOrderNumber(q) : null;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            ...(num !== null && num > 0 ? [{ number: num }] : []),
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q.replace(/\s/g, "") } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { _count: { select: { items: true } } } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const current = { q: sp.q, status: sp.status };

  return (
    <div>
      <AdminPageHeader title={t("title")} description={String(total)} />
      <ListToolbar
        current={current}
        placeholder={t("searchPlaceholder")}
        selects={[{ name: "status", label: t("status"), options: [{ value: "", label: "—" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ts(s) }))] }]}
      />
      {orders.length === 0 ? (
        <EmptyState emoji="🧾" title={t("noOrders")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3">{t("id")}</th>
                <th className="px-2 py-3">{t("customer")}</th>
                <th className="px-2 py-3">{t("date")}</th>
                <th className="px-2 py-3">{t("items")}</th>
                <th className="px-2 py-3">{t("total")}</th>
                <th className="px-2 py-3">{t("payment")}</th>
                <th className="px-2 py-3">{t("delivery")}</th>
                <th className="px-4 py-3">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-display font-bold hover:underline">
                      {formatOrderNumber(o.number)}
                    </Link>
                  </td>
                  <td className="px-2 py-3">
                    <span className="block font-semibold">
                      {o.firstName} {o.lastName}
                    </span>
                    <span className="text-xs text-muted">{o.userId ? o.email : `${t("guest")} · ${o.email}`}</span>
                  </td>
                  <td className="px-2 py-3 text-muted">{format.dateTime(o.createdAt, { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-2 py-3 tabular-nums">{o._count.items}</td>
                  <td className="px-2 py-3 font-semibold tabular-nums">{formatPrice(o.total, locale)}</td>
                  <td className="px-2 py-3">
                    <Badge variant={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "FAILED" ? "error" : "neutral"} size="sm">
                      {tp(o.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="px-2 py-3 text-xs">{tco(`methods.${o.deliveryMethod}`)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_TONE[o.status]} size="sm">
                      {ts(o.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(n) => {
          const u = new URLSearchParams(Object.entries(current).filter(([, v]) => v) as [string, string][]);
          if (n > 1) u.set("page", String(n));
          return `/admin/orders${u.toString() ? `?${u}` : ""}`;
        }}
        labels={{ prev: "←", next: "→", nav: t("title"), page: (p) => ta("pagination", { page: p, total: pageCount }) }}
      />
    </div>
  );
}
