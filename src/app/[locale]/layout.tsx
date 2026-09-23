import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { manrope, unbounded } from "@/lib/fonts";
import { StoreProvider } from "@/features/store/store-provider";

// Empty list on purpose: nothing is prerendered at build time (the build never needs the
// database); each page is rendered on its first request and then cached (ISR, see `revalidate`).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: t("title"), template: "%s · AsiaShop" },
    description: t("description"),
    applicationName: "AsiaShop",
    openGraph: { siteName: "AsiaShop", type: "website", locale },
    alternates: {
      languages: { uk: "/", ru: "/ru", en: "/en" },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#FAF6F1",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <StoreProvider>{children}</StoreProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "!rounded-2xl !border-2 !border-ink !bg-white !font-sans !text-ink !shadow-pop",
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
