import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/features/admin/components/page-header";
import { PromoManager } from "@/features/admin/promocodes/promo-manager";

export default async function AdminPromoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdminPage("promocodes:write");
  const t = await getTranslations("admin.promocodes");
  const codes = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <AdminPageHeader title={t("title")} />
      <PromoManager
        rows={codes.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minOrder: c.minOrder,
          startsAt: c.startsAt?.toISOString() ?? null,
          endsAt: c.endsAt?.toISOString() ?? null,
          usageLimit: c.usageLimit,
          perUserLimit: c.perUserLimit,
          usedCount: c.usedCount,
          isActive: c.isActive,
          description: c.description,
        }))}
      />
    </div>
  );
}
