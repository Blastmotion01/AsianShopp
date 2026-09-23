"use client";

import { useLocale, useTranslations } from "next-intl";
import { DropdownMenu } from "radix-ui";
import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/config/site";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, { short: string; full: string }> = {
  uk: { short: "UA", full: "Українська" },
  ru: { short: "RU", full: "Русский" },
  en: { short: "EN", full: "English" },
};

export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  return (next: Locale) => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${search}`, { locale: next, scroll: false });
  };
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const switchTo = useSwitchLocale();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold hover:bg-ink/5", className)}
        aria-label={`${t("language")}: ${LABELS[locale].full}`}
      >
        <Globe className="size-4" aria-hidden="true" />
        {LABELS[locale].short}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-40 rounded-lg border-2 border-ink bg-white p-1.5 shadow-pop"
        >
          {locales.map((l) => (
            <DropdownMenu.Item
              key={l}
              onSelect={() => switchTo(l)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-semibold outline-none data-[highlighted]:bg-cream-100"
              lang={l}
            >
              {LABELS[l].full}
              {l === locale && <Check className="size-4 text-coral-600" aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function LanguagePills() {
  const locale = useLocale() as Locale;
  const switchTo = useSwitchLocale();
  return (
    <div className="flex gap-2">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className={cn(
            "h-10 rounded-full border-2 border-ink px-4 text-sm font-bold",
            l === locale ? "bg-ink text-white" : "bg-white",
          )}
        >
          {LABELS[l].short}
        </button>
      ))}
    </div>
  );
}
