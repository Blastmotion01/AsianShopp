"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Route-level error boundary. Never shows stack traces — only a digest for support. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-page grid min-h-[60dvh] place-items-center py-16 text-center">
      <div>
        <div className="mx-auto grid size-24 place-items-center rounded-full border-2 border-ink bg-cream-200 text-5xl shadow-pop" aria-hidden="true">
          🫠
        </div>
        <h1 className="mt-6 font-display text-3xl font-extrabold">{t("errorTitle")}</h1>
        <p className="mt-3 text-muted">{t("errorText")}</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-muted">#{error.digest}</p>}
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="accent" onClick={reset}>
            {t("tryAgain")}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{t("toHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
