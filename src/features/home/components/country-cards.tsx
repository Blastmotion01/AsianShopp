import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/brand/flag";

export type CountryCardData = { code: string; name: string; tagline: string; flag: string; count: string };

const STYLE: Record<string, { card: string; text: string; bubble: string }> = {
  KR: { card: "bg-pink-300", text: "text-ink", bubble: "bg-white/50" },
  JP: { card: "bg-cream-200", text: "text-ink", bubble: "bg-coral-500/25" },
  CN: { card: "bg-coral-500", text: "text-ink", bubble: "bg-cream-200/50" },
  US: { card: "bg-ink", text: "text-cream-100", bubble: "bg-pink-300/30" },
};

/**
 * "Choose your country" — tilted cards that straighten, lift, scale and reveal
 * their tagline on hover/focus. Pure CSS transitions (GPU transforms only).
 */
export function CountryCards({ countries, exploreLabel }: { countries: CountryCardData[]; exploreLabel: string }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
      {countries.map((c, i) => {
        const s = STYLE[c.code] ?? STYLE.KR;
        const tilt = i % 2 ? "1.5deg" : "-1.5deg";
        return (
          <li key={c.code} className="reveal-tilt" style={{ ["--tilt-from" as string]: i % 2 ? "5deg" : "-5deg" }}>
            <Link
              href={`/products?country=${c.code}`}
              style={{ ["--tilt" as string]: tilt }}
              className={cn(
                "group relative flex aspect-[4/5] rotate-(--tilt) flex-col overflow-hidden rounded-2xl border-2 border-ink p-4 shadow-pop transition-[transform,box-shadow] duration-500 ease-[var(--ease-bounce)] hover:-translate-y-2.5 hover:scale-[1.03] hover:rotate-0 hover:shadow-[0_10px_0_0_var(--color-ink)] focus-visible:rotate-0 md:p-6",
                s.card,
                s.text,
              )}
            >
              <span aria-hidden="true" className={cn("absolute -top-10 -right-10 size-40 rounded-full transition-transform duration-500 group-hover:scale-150", s.bubble)} />
              <span
                aria-hidden="true"
                className="relative inline-block self-start text-[clamp(3rem,9vw,5rem)] leading-none transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12"
              >
                <Flag code={c.code} className="rounded-lg border-2 border-ink shadow-[0_5px_0_0_var(--color-ink)]" />
              </span>
              <span className="relative mt-auto pr-12">
                <span className="block font-display text-2xl font-extrabold md:text-4xl">{c.name}</span>
                <span className="mt-1 block text-sm font-semibold opacity-75">{c.count}</span>
                <span className="mt-2 block text-sm leading-snug font-medium opacity-90 transition-all duration-500 md:max-h-0 md:overflow-hidden md:opacity-0 md:group-hover:max-h-20 md:group-hover:opacity-100 md:group-focus-visible:max-h-20 md:group-focus-visible:opacity-100">
                  {c.tagline}
                </span>
              </span>
              <span
                className="absolute right-4 bottom-4 grid size-11 place-items-center rounded-full border-2 border-ink bg-white text-ink transition-transform duration-300 group-hover:rotate-45 md:right-6 md:bottom-6"
                aria-hidden="true"
              >
                <ArrowUpRight className="size-5" />
              </span>
              <span className="sr-only">{exploreLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
