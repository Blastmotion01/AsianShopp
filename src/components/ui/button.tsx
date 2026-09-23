import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none transition-[transform,box-shadow,background-color,color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:size-[1.15em] cursor-pointer",
  {
    variants: {
      variant: {
        // Chunky "pressable" buttons: dark outline + offset shadow that collapses on press.
        primary:
          "bg-ink text-white border-2 border-ink shadow-[0_4px_0_0_var(--color-coral-500)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-coral-500)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-coral-500)]",
        accent:
          "bg-coral-500 text-ink border-2 border-ink shadow-pop hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-ink)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-ink)]",
        pink:
          "bg-pink-300 text-ink border-2 border-ink shadow-pop hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--color-ink)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-ink)]",
        outline:
          "bg-white text-ink border-2 border-ink shadow-pop-sm hover:-translate-y-0.5 hover:bg-cream-100 active:translate-y-[2px] active:shadow-none",
        soft: "bg-cream-100 text-ink hover:bg-cream-200",
        ghost: "text-ink hover:bg-ink/5",
        danger: "bg-error text-white hover:bg-coral-800",
        link: "text-coral-700 underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-full",
        md: "h-11 px-5 text-[0.95rem] rounded-full",
        lg: "h-14 px-7 text-base md:text-lg rounded-full",
        icon: "size-10 rounded-full",
        "icon-sm": "size-8 rounded-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner />}
          {children}
        </>
      )}
    </Comp>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
