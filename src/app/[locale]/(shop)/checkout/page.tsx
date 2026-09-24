import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isPaymentTestMode } from "@/lib/integrations/payments";
import { CheckoutForm } from "@/features/orders/components/checkout-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const user = await getCurrentUser();
  const addresses = user ? await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) : [];

  return (
    <div className="container-page pt-6 pb-10 md:pt-10">
      <h1 className="mb-8 font-display text-4xl font-extrabold md:text-5xl">{t("title")}</h1>
      <CheckoutForm
        isGuest={!user}
        paymentTestMode={isPaymentTestMode()}
        defaults={{ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "", email: user?.email ?? "" }}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          firstName: a.firstName,
          lastName: a.lastName,
          phone: a.phone,
          city: a.city,
          deliveryMethod: a.deliveryMethod,
          branch: a.branch,
          street: a.street,
        }))}
      />
    </div>
  );
}
