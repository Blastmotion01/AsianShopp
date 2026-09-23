import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children, footer, emoji }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; emoji: string }) {
  return (
    <div className="container-page grid min-h-[70dvh] place-items-center py-10 md:py-16">
      <div className="relative w-full max-w-md">
        <span aria-hidden="true" className="absolute -top-8 right-2 z-10 grid size-16 rotate-12 place-items-center rounded-2xl border-2 border-ink bg-pink-300 text-3xl shadow-pop-sm">
          {emoji}
        </span>
        <div className="rounded-2xl border-2 border-ink bg-white p-6 shadow-pop md:p-8">
          <h1 className="font-display text-3xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
