import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/auth-forms";
import { safeNext } from "@/features/auth/schemas";

// Reads cookies / URL params: always render per request (never statically cached).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("registerTitle"), robots: { index: false } };
}

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect({ href: safeNext(next), locale });
  const t = await getTranslations("auth");
  return (
    <AuthCard
      emoji="🍡"
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-bold text-coral-700 hover:underline">
            {t("login")}
          </Link>
        </>
      }
    >
      <RegisterForm next={safeNext(next)} />
    </AuthCard>
  );
}
