import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ListToolbar } from "@/features/admin/components/list-toolbar";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { formatPrice } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/config/site";

const PAGE = 30;

export default async function AdminCustomersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("customers:read");
  const sp = await searchParams;
  const [t, ta, format] = await Promise.all([getTranslations("admin.customers"), getTranslations("admin"), getFormatter()]);
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim().slice(0, 80);

  const where: Prisma.UserWhereInput = {
    role: { key: "CUSTOMER" },
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\s/g, "") } },
          ],
        }
      : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true } }),
  ]);
  // Aggregates for this page only (one grouped query instead of N+1).
  const stats = await db.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, status: { not: "CANCELLED" } },
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
  });
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  const pageCount = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div>
      <AdminPageHeader title={t("title")} description={String(total)} />
      <ListToolbar current={{ q: sp.q }} placeholder={t("searchPlaceholder")} />
      {users.length === 0 ? (
        <EmptyState emoji="👥" title={t("noCustomers")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-2 py-3">{t("email")}</th>
                <th className="px-2 py-3">{t("phone")}</th>
                <th className="px-2 py-3">{t("orders")}</th>
                <th className="px-2 py-3">{t("spent")}</th>
                <th className="px-2 py-3">{t("lastOrder")}</th>
                <th className="px-4 py-3">{t("registered")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const s = byUser.get(u.id);
                return (
                  <tr key={u.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 font-semibold">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/admin/orders?q=${encodeURIComponent(u.email)}`} className="hover:underline">
                        {u.email}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-muted">{u.phone ?? "—"}</td>
                    <td className="px-2 py-3 tabular-nums">{s?._count._all ?? 0}</td>
                    <td className="px-2 py-3 font-semibold tabular-nums">{formatPrice(s?._sum.total ?? 0, locale)}</td>
                    <td className="px-2 py-3 text-muted">{s?._max.createdAt ? format.dateTime(s._max.createdAt, { dateStyle: "short" }) : "—"}</td>
                    <td className="px-4 py-3 text-muted">{format.dateTime(u.createdAt, { dateStyle: "short" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(n) => `/admin/customers?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`}
        labels={{ prev: "←", next: "→", nav: t("title"), page: (p) => ta("pagination", { page: p, total: pageCount }) }}
      />
    </div>
  );
}
