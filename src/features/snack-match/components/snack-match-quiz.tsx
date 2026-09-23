"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/features/products/components/product-card";
import type { ProductCardData } from "@/features/products/types";
import { QUESTIONS, type Answers } from "../matcher";
import { snackMatchAction } from "../actions";

const EMOJI: Record<string, string> = { sweet: "🍬", spicy: "🌶️", format: "🥤", unusual: "🐙", adventure: "🚀" };

export function SnackMatchQuiz() {
  const t = useTranslations("snackMatch");
  const [step, setStep] = React.useState(-1); // -1 = intro
  const [answers, setAnswers] = React.useState<Partial<Answers>>({});
  const [result, setResult] = React.useState<{ products: ProductCardData[]; fallback: boolean } | null>(null);
  const [pending, start] = React.useTransition();
  const total = QUESTIONS.length;
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step, result]);

  function choose(qid: string, value: string) {
    const next = { ...answers, [qid]: value } as Partial<Answers>;
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      setStep(total);
      start(async () => {
        const res = await snackMatchAction(next as Answers);
        setResult({ products: res.products, fallback: res.fallback });
      });
    }
  }

  function restart() {
    setAnswers({});
    setResult(null);
    setStep(0);
  }

  if (step === -1) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex justify-center gap-3 text-5xl" aria-hidden="true">
          {Object.values(EMOJI).map((e, i) => (
            <span key={e} className="animate-float" style={{ animationDelay: `${i * -1.2}s` }}>
              {e}
            </span>
          ))}
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-5xl font-extrabold outline-none md:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-muted md:text-xl">{t("subtitle")}</p>
        <Button variant="accent" size="lg" className="mt-8" onClick={() => setStep(0)}>
          <Sparkles aria-hidden="true" /> {t("start")}
        </Button>
      </div>
    );
  }

  if (step >= total) {
    return (
      <div>
        <div className="mb-8 text-center">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-4xl font-extrabold outline-none md:text-6xl">
            {t("results")} ✨
          </h1>
          <p className="mt-3 text-lg text-muted">{result?.fallback ? t("noResults") : t("resultsText")}</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5" aria-busy={pending}>
          {pending || !result
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <ProductCardSkeleton />
                </li>
              ))
            : result.products.map((p) => (
                <motion.li key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <ProductCard product={p} />
                </motion.li>
              ))}
        </ul>
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={restart}>
            <RotateCcw aria-hidden="true" /> {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white disabled:opacity-30"
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <p className="mb-2 text-sm font-bold text-muted">{t("progress", { n: step + 1, total })}</p>
          <div className="h-3 overflow-hidden rounded-full bg-white ring-2 ring-ink" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total}>
            <motion.div className="h-full bg-coral-500" initial={false} animate={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
          <div className="text-center text-6xl" aria-hidden="true">
            {EMOJI[q.id]}
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-center font-display text-3xl font-extrabold outline-none md:text-5xl">
            {t(`questions.${q.id}.q`)}
          </h1>
          <ul className="mt-8 grid gap-3">
            {q.options.map((opt) => {
              const selected = answers[q.id as keyof Answers] === opt;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => choose(q.id, opt)}
                    aria-pressed={selected}
                    className={`w-full rounded-2xl border-2 border-ink px-6 py-5 text-left font-display text-lg font-bold shadow-pop-sm transition-all hover:-translate-y-0.5 hover:bg-pink-100 active:translate-y-0.5 active:shadow-none md:text-xl ${
                      selected ? "bg-pink-300" : "bg-white"
                    }`}
                  >
                    {t(`questions.${q.id}.a.${opt}` as "questions.sweet.a.love")}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
