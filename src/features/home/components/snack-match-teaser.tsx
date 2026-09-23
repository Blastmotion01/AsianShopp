import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function SnackMatchTeaser({ title, subtitle, cta, questions }: { title: string; subtitle: string; cta: string; questions: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-pink-300 p-6 md:p-12">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="font-display text-sm font-bold tracking-widest uppercase">Snack Match</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold md:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-lg font-semibold text-ink/80">{subtitle}</p>
          <Button asChild variant="primary" size="lg" className="mt-7">
            <Link href="/snack-match">
              {cta} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <ul className="relative flex flex-col gap-3" aria-hidden="true">
          {questions.slice(0, 4).map((q, i) => (
            <li
              key={q}
              className={`w-fit max-w-full rounded-2xl border-2 border-ink bg-white px-5 py-3 font-display text-base font-bold shadow-pop-sm md:text-lg ${
                i % 2 ? "self-end rotate-2 bg-cream-100" : "-rotate-1"
              }`}
            >
              {q}
            </li>
          ))}
          <li className="absolute -top-6 right-4 animate-float text-5xl">🤔</li>
        </ul>
      </div>
    </div>
  );
}
