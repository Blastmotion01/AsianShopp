import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-display font-bold uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        NEW: "bg-pink-300 text-ink",
        BESTSELLER: "bg-ink text-cream-200",
        LIMITED: "bg-cream-200 text-ink ring-2 ring-ink",
        HOT: "bg-coral-500 text-ink",
        SALE: "bg-coral-700 text-white",
        neutral: "bg-ink/5 text-ink",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        error: "bg-error-soft text-error",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.65rem]",
        md: "px-2.5 py-1 text-[0.7rem]",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
