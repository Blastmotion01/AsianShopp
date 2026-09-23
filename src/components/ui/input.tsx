import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-md border-2 border-line bg-white px-4 text-[0.95rem] text-ink placeholder:text-muted/70 transition-colors outline-none focus-visible:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 disabled:opacity-60 aria-[invalid=true]:border-error";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={cn(fieldBase, "h-12 appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-ink", className)} {...props} />;
}

export function Checkbox({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <span className={cn("relative inline-grid size-5 shrink-0", className)}>
      <input
        type="checkbox"
        className="peer size-5 cursor-pointer appearance-none rounded-[6px] border-2 border-ink bg-white transition-colors checked:bg-coral-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
        {...props}
      />
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute inset-0 m-auto size-4 opacity-0 transition-opacity peer-checked:opacity-100"
        aria-hidden="true"
      >
        <path d="M5 10.5l3 3 7-7" fill="none" stroke="#2a1f24" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Label + control + error message with proper aria wiring. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="mt-1.5 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
