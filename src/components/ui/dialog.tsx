"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;
export const DialogTitle = D.Title;
export const DialogDescription = D.Description;

function Overlay({ className, ...props }: React.ComponentProps<typeof D.Overlay>) {
  return (
    <D.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.2s_ease-out] data-[state=closed]:animate-[fade-out_.15s_ease-in]",
        className,
      )}
      {...props}
    />
  );
}

/** Centered modal dialog. */
export function DialogContent({
  className,
  children,
  closeLabel,
  ...props
}: React.ComponentProps<typeof D.Content> & { closeLabel: string }) {
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border-2 border-ink bg-white p-6 shadow-lift data-[state=open]:animate-[pop-in_.25s_var(--ease-bounce)]",
          className,
        )}
        {...props}
      >
        {children}
        <D.Close
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full hover:bg-ink/5"
          aria-label={closeLabel}
        >
          <X className="size-5" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

/** Side drawer (cart, mobile menu, filters). */
export function SheetContent({
  className,
  children,
  side = "right",
  closeLabel,
  ...props
}: React.ComponentProps<typeof D.Content> & { side?: "right" | "left" | "bottom"; closeLabel: string }) {
  const sideClass = {
    right:
      "inset-y-0 right-0 h-dvh w-full max-w-md border-l-2 data-[state=open]:animate-[slide-in-right_.35s_var(--ease-soft)] data-[state=closed]:animate-[slide-out-right_.25s_ease-in]",
    left: "inset-y-0 left-0 h-dvh w-[88%] max-w-sm border-r-2 data-[state=open]:animate-[slide-in-left_.35s_var(--ease-soft)] data-[state=closed]:animate-[slide-out-left_.25s_ease-in]",
    bottom:
      "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t-2 data-[state=open]:animate-[slide-in-up_.35s_var(--ease-soft)] data-[state=closed]:animate-[slide-out-down_.25s_ease-in]",
  }[side];
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        className={cn("fixed z-50 flex flex-col border-ink bg-neutral shadow-lift outline-none", sideClass, className)}
        {...props}
      >
        {children}
        <D.Close
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white ring-2 ring-ink transition-transform hover:rotate-90"
          aria-label={closeLabel}
        >
          <X className="size-5" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
