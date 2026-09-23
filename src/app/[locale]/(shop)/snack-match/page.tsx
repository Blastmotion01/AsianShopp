import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SnackMatchQuiz } from "@/features/snack-match/components/snack-match-quiz";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "snackMatch" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function SnackMatchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 size-[28rem] rounded-full bg-pink-200/70 blur-3xl" />
        <div className="absolute right-0 bottom-0 size-[24rem] rounded-full bg-cream-200 blur-3xl" />
      </div>
      <div className="container-page min-h-[70dvh] py-12 md:py-20">
        <SnackMatchQuiz />
      </div>
    </div>
  );
}
