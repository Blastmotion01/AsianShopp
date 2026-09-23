import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUserPage } from "@/lib/auth/guards";
import { AccountNav } from "@/features/account/components/account-nav";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccountLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUserPage("/account");
  const t = await getTranslations("account");
  return (
    <div className="container-page pt-6 pb-10 md:pt-10">
      <p className="font-display text-sm font-bold tracking-widest text-coral-700 uppercase">{t("title")}</p>
      <h1 className="mt-1 mb-8 font-display text-4xl font-extrabold md:text-5xl">{t("hello", { name: user.firstName })}</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
