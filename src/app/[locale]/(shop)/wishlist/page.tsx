import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getWishlistProducts } from "@/features/wishlist/service";
import { getCurrentUser } from "@/lib/auth/session";
import { WishlistGrid } from "@/features/wishlist/components/wishlist-grid";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "wishlist" });
  return { title: t("title"), robots: { index: false } };
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [t, tn, tc] = await Promise.all([getTranslations("wishlist"), getTranslations("nav"), getTranslations("cart")]);
  const [products, user] = await Promise.all([getWishlistProducts(locale), getCurrentUser()]);

  return (
    <div className="container-page pt-6 pb-10 md:pt-10">
      <h1 className="font-display text-4xl font-extrabold md:text-5xl">
        {t("title")} <span className="text-pink-500">♥</span>
      </h1>
      {products.length > 0 && <p className="mt-2 text-muted">{t("count", { count: products.length })}</p>}
      {!user && products.length > 0 && (
        <p className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm">
          {t("guestHint")}{" "}
          <Link href="/login?next=/wishlist" className="font-bold text-coral-700 underline">
            {tn("login")}
          </Link>
        </p>
      )}
      <WishlistGrid
        products={products}
        empty={
          <EmptyState
            emoji="💝"
            title={t("empty")}
            text={t("emptyText")}
            action={
              <Button asChild variant="accent">
                <Link href="/products">{tc("continue")}</Link>
              </Button>
            }
          />
        }
      />
    </div>
  );
}
