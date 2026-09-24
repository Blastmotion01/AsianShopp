import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { ScanStation } from "@/features/admin/scan/scan-station";

export default async function AdminScanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPage("products:write");
  const t = await getTranslations("admin.scan");
  return (
    <div>
      <AdminPageHeader title={t("title")} description={t("subtitle")} />
      <ScanStation />
    </div>
  );
}
