import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetForm } from "@/features/auth/components/auth-forms";

// Reads cookies / URL params: always render per request (never statically cached).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false } };

export default async function ResetPasswordPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const t = await getTranslations("auth");
  const te = await getTranslations("errors");
  return (
    <AuthCard emoji="🔒" title={t("resetTitle")}>
      {token ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-4">
          <p className="rounded-md bg-error-soft px-4 py-3 font-semibold text-error">{te("invalid_token")}</p>
          <Link href="/forgot-password" className="font-bold text-coral-700 hover:underline">
            {t("forgotTitle")}
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
