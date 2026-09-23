import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
  className,
  tone = "dark",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <h2 className={cn("font-display text-3xl font-extrabold md:text-5xl", tone === "light" && "text-white")}>{title}</h2>
        {subtitle && <p className={cn("mt-3 max-w-xl text-base md:text-lg", tone === "light" ? "text-cream-100/75" : "text-muted")}>{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 self-start font-bold md:self-auto",
            tone === "light" ? "text-pink-300" : "text-coral-700",
          )}
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
