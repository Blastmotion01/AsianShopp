import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Link href="/" className="inline-block">
          <Logo />
        </Link>
        <p className="mt-10 font-display text-[7rem] leading-none font-extrabold text-coral-500 [text-shadow:0_6px_0_var(--color-ink)] md:text-[10rem]">404</p>
        <h1 className="mt-6 font-display text-3xl font-extrabold">{t("notFoundTitle")}</h1>
        <p className="mt-3 text-lg text-muted">{t("notFoundText")}</p>
        <Button asChild variant="accent" size="lg" className="mt-8">
          <Link href="/">{t("toHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
