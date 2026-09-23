import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { safeNext } from "@/features/auth/schemas";
import { Link } from "@/i18n/navigation";

// Reads cookies / URL params: always render per request (never statically cached).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("login"), robots: { index: false } };
}

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect({ href: safeNext(next), locale });
  const t = await getTranslations("auth");
  const nextSafe = safeNext(next);
  return (
    <AuthCard
      emoji="👋"
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href={`/register${next ? `?next=${encodeURIComponent(nextSafe)}` : ""}`} className="font-bold text-coral-700 hover:underline">
            {t("register")}
          </Link>
        </>
      }
    >
      <LoginForm next={nextSafe} />
    </AuthCard>
  );
}
