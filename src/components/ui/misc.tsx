import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-ink/[0.07]", className)} aria-hidden="true" {...props} />;
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border-2 border-line bg-white", className)} {...props} />;
}

export function EmptyState({
  emoji,
  title,
  text,
  action,
  className,
}: {
  emoji: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div
        className="mb-5 grid size-24 place-items-center rounded-full border-2 border-ink bg-cream-200 text-5xl shadow-pop"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
      {text && <p className="mt-2 max-w-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stars({ value, className, label }: { value: number; className?: string; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        return (
          <svg key={i} viewBox="0 0 20 20" className="size-4" aria-hidden="true">
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="#F0573A" />
                <stop offset={`${fill * 100}%`} stopColor="#E6DCD4" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#s${i}-${Math.round(fill * 100)})`}
              d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z"
            />
          </svg>
        );
      })}
    </span>
  );
}

/** 0–5 chili meter. */
export function SpiceMeter({ level, label, className }: { level: number; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={cn("size-4", i <= level ? "text-coral-500" : "text-ink/15")} aria-hidden="true">
          <path
            fill="currentColor"
            d="M14.5 3.2c.4-.8 1.6-.6 1.7.3.1.8-.2 1.6-.7 2.2 2.4 1 3.7 3.4 3.3 6.3-.7 5-5.6 9.3-11.8 9.8-1 .1-1.4-1.2-.5-1.7 3.6-2 5-5.1 5.3-8.2.2-2.5 1.2-4.3 3.1-5.1-.4-1.2-.8-2.6-.4-3.6z"
          />
        </svg>
      ))}
    </span>
  );
}

export function Price({
  value,
  compareAt,
  className,
  size = "md",
}: {
  value: string;
  compareAt?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "text-base", md: "text-lg", lg: "text-3xl" };
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-display font-bold", sizes[size], compareAt && "text-coral-700")}>{value}</span>
      {compareAt && <s className="text-sm text-muted">{compareAt}</s>}
    </span>
  );
}
