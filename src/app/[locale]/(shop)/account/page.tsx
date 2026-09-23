import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUserPage } from "@/lib/auth/guards";
import { ProfileForm, PasswordForm } from "@/features/account/components/profile-forms";

export default async function AccountProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUserPage("/account");
  const t = await getTranslations("account");
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-line bg-white p-5 md:p-7">
        <h2 className="mb-5 font-display text-xl font-bold">{t("profile")}</h2>
        <ProfileForm defaults={{ firstName: user.firstName, lastName: user.lastName ?? "", phone: user.phone ?? "", email: user.email }} />
      </section>
      <section className="rounded-2xl border-2 border-line bg-white p-5 md:p-7">
        <h2 className="mb-5 font-display text-xl font-bold">{t("changePassword")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
