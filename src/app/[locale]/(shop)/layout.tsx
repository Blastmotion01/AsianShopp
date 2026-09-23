import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/features/cart/components/cart-drawer";
import { getHomeBlocks } from "@/features/cms/queries";
import { getCountries, getPopularSearches } from "@/features/products/queries";
import type { AnnouncementData } from "@/features/cms/blocks";
import { notFound } from "next/navigation";
import { isLocale, pickLocalized } from "@/lib/localized";
import type { Locale } from "@/config/site";

export default async function ShopLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  // Layouts render in parallel with the parent's locale check, so validate here too.
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  setRequestLocale(locale);

  const [blocks, countries, popular] = await Promise.all([getHomeBlocks(), getCountries(), getPopularSearches(locale)]);
  const ann = blocks.find((b) => b.key === "announcement");
  const annData = ann?.data as AnnouncementData | undefined;
  const announcement = ann?.isActive && annData ? { text: pickLocalized(annData.text, locale), href: annData.href } : null;
  const navCountries = countries.map((c) => ({ code: c.code, name: pickLocalized(c.nameRaw, locale), flag: c.flag }));

  return (
    <>
      <Header announcement={announcement} countries={navCountries} popularSearches={popular} />
      <main id="main" className="min-h-[60dvh]">
        {children}
      </main>
      <Footer countries={navCountries} />
      <CartDrawer />
    </>
  );
}
