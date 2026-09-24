"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Keyboard, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "./barcode-scanner";
import { lookupCodeAction } from "./actions";

/**
 * Scan → found: open the product card for editing; not found: open "new product"
 * with the barcode pre-filled. Manual entry is always available as a fallback.
 */
export function ScanStation() {
  const t = useTranslations("admin.scan");
  const te = useTranslations("errors");
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState("");

  const handle = React.useCallback(
    async (raw: string) => {
      const code = raw.trim();
      if (!code || busy) return;
      setBusy(code);
      const res = await lookupCodeAction(code);
      if (!res.ok) {
        toast.error(te.has(res.error) ? te(res.error) : te("generic"));
        setBusy(null);
        return;
      }
      const { match } = res.data;
      if (match) {
        toast.success(t("found", { name: match.name }));
        router.push(`/admin/products/${match.productId}?scanned=${encodeURIComponent(code)}`);
      } else {
        toast.info(t("notFound", { code }));
        router.push(`/admin/products/new?barcode=${encodeURIComponent(code)}`);
      }
    },
    [busy, router, t, te],
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <BarcodeScanner onDetected={handle} paused={!!busy} />

      <p className="text-center text-sm font-semibold text-muted" aria-live="polite">
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t("searching", { code: busy })}
          </span>
        ) : (
          t("aim")
        )}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handle(manual);
        }}
        className="flex gap-2 rounded-2xl border-2 border-line bg-white p-3"
      >
        <label htmlFor="manual-code" className="sr-only">
          {t("manualLabel")}
        </label>
        <div className="relative flex-1">
          <Keyboard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            id="manual-code"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t("manualPlaceholder")}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="pl-9"
            maxLength={64}
          />
        </div>
        <Button type="submit" disabled={!manual.trim() || !!busy}>
          {t("find")}
        </Button>
      </form>
      <p className="text-center text-xs text-muted">{t("hint")}</p>
    </div>
  );
}
