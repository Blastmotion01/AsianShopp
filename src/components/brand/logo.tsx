import { cn } from "@/lib/utils";

/**
 * AsiaShop wordmark — soft 3D "bubble" letters (gradient fill + extrusion shadow).
 * variant="full"    → "AsiaShop" (header, footer)
 * variant="compact" → "aS" bubble badge (tight spaces, admin sidebar, favicon-like)
 */
export function Logo({ variant = "full", className, onDark }: { variant?: "full" | "compact"; className?: string; onDark?: boolean }) {
  if (variant === "compact") {
    return (
      <span
        className={cn(
          "relative inline-grid size-10 place-items-center rounded-[14px] border-2 border-ink bg-coral-500 font-display text-lg font-extrabold text-white shadow-pop-sm",
          className,
        )}
        aria-hidden="true"
      >
        <span className="absolute top-1 left-1.5 h-2 w-4 rounded-full bg-white/45" />
        <span className="relative -tracking-[0.06em]">aS</span>
        <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-ink bg-pink-300" />
      </span>
    );
  }
  return (
    <span className={cn("logo-bubble text-[1.55rem] md:text-[1.75rem]", onDark && "on-dark", className)} aria-hidden="true">
      <span className="l-asia">Asia</span>
      <span className="l-shop">Shop</span>
    </span>
  );
}
