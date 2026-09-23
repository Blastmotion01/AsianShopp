"use client";

import * as React from "react";
import { Copy, Check, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function PromoBanner({
  title,
  text,
  code,
  ctaLabel,
  ctaHref,
  copyLabel,
  copiedLabel,
}: {
  title: string;
  text: string;
  code: string;
  ctaLabel: string;
  ctaHref: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-coral-500 p-6 shadow-pop md:p-12">
      <div aria-hidden="true" className="absolute -top-16 -right-10 size-64 rounded-full bg-pink-300/60" />
      <div aria-hidden="true" className="absolute -bottom-20 left-1/3 size-56 rounded-full bg-cream-200/50" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink md:text-5xl">{title}</h2>
          <p className="mt-3 max-w-lg text-lg font-semibold text-ink/80">{text}</p>
          <Button asChild variant="primary" size="lg" className="mt-6">
            <Link href={ctaHref}>
              {ctaLabel} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        {code && (
          <button
            type="button"
            onClick={copy}
            className="group flex -rotate-2 flex-col items-center gap-2 justify-self-start rounded-2xl border-2 border-dashed border-ink bg-white px-8 py-6 transition-transform hover:rotate-0 md:justify-self-end"
            aria-label={`${copyLabel}: ${code}`}
          >
            <span className="font-display text-3xl font-extrabold tracking-wider md:text-4xl">{code}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-coral-700" aria-live="polite">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? copiedLabel : copyLabel}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
