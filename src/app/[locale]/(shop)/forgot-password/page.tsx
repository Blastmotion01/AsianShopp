import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotForm } from "@/features/auth/components/auth-forms";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgotTitle"), robots: { index: false } };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthCard
      emoji="🔑"
      title={t("forgotTitle")}
      subtitle={t("forgotText")}
      footer={
        <Link href="/login" className="font-bold text-coral-700 hover:underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
