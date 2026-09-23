import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { pickLocalized } from "@/lib/localized";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { CmsEditor, type CmsBlock } from "@/features/admin/cms/cms-editor";
import { getHomeBlocks, getStoreSettings } from "@/features/cms/queries";
import type { Locale } from "@/config/site";

export default async function AdminCmsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  await requireAdminPage("cms:write");
  const t = await getTranslations("admin.cms");
  const [blocks, settings, categories] = await Promise.all([getHomeBlocks(), getStoreSettings(), db.category.findMany({ orderBy: { sortOrder: "asc" } })]);

  // Announcement bar always first in the editor (it isn't part of the page flow).
  const ordered = [...blocks.filter((b) => b.key === "announcement"), ...blocks.filter((b) => b.key !== "announcement")];

  return (
    <div>
      <AdminPageHeader title={t("title")} />
      <CmsEditor
        blocks={ordered.map((b) => ({ key: b.key, type: b.type as CmsBlock["type"], data: b.data as Record<string, unknown>, isActive: b.isActive }))}
        settings={settings}
        categories={categories.map((c) => ({ id: c.id, name: `${c.emoji ?? ""} ${pickLocalized(c.name, locale)}`.trim(), showOnHome: c.showOnHome }))}
      />
    </div>
  );
}
