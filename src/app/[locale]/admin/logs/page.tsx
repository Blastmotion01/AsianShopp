import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";

const PAGE = 50;

export default async function AdminLogsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPage("logs:read");
  const sp = await searchParams;
  const [t, ta, format] = await Promise.all([getTranslations("admin.logs"), getTranslations("admin"), getFormatter()]);
  const page = Math.max(1, Number(sp.page) || 1);
  const [total, logs] = await Promise.all([db.adminLog.count(), db.adminLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE })]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div>
      <AdminPageHeader title={t("title")} description={String(total)} />
      {logs.length === 0 ? (
        <EmptyState emoji="📜" title={t("noLogs")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-line bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-cream-50 text-left text-xs font-bold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-2 py-3">{t("admin")}</th>
                <th className="px-2 py-3">{t("action")}</th>
                <th className="px-2 py-3">{t("entity")}</th>
                <th className="px-2 py-3">{t("entityId")}</th>
                <th className="px-4 py-3">{t("details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((l) => (
                <tr key={l.id} className="align-top hover:bg-cream-50">
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{format.dateTime(l.createdAt, { dateStyle: "short", timeStyle: "medium" })}</td>
                  <td className="px-2 py-3 font-semibold">{l.userName}</td>
                  <td className="px-2 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-2 py-3">{l.entity}</td>
                  <td className="px-2 py-3 font-mono text-xs text-muted">{l.entityId ?? "—"}</td>
                  <td className="max-w-md px-4 py-3 font-mono text-xs break-all text-muted">{l.details ? JSON.stringify(l.details) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageCount={pageCount}
        hrefFor={(n) => `/admin/logs${n > 1 ? `?page=${n}` : ""}`}
        labels={{ prev: "←", next: "→", nav: t("title"), page: (p) => ta("pagination", { page: p, total: pageCount }) }}
      />
    </div>
  );
}
