import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Server-rendered pagination (crawlable links). */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  labels,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  labels: { prev: string; next: string; nav: string; page: (p: number) => string };
}) {
  if (pageCount <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const cls = "grid size-11 place-items-center rounded-full border-2 font-bold transition-colors";
  return (
    <nav aria-label={labels.nav} className="mt-12 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(cls, "border-ink bg-white hover:bg-cream-100")} aria-label={labels.prev} rel="prev">
          <ChevronLeft className="size-5" />
        </Link>
      ) : (
        <span className={cn(cls, "border-line text-ink/30")} aria-hidden="true">
          <ChevronLeft className="size-5" />
        </span>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={labels.page(p)}
            className={cn(cls, p === page ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(cls, "border-ink bg-white hover:bg-cream-100")} aria-label={labels.next} rel="next">
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span className={cn(cls, "border-line text-ink/30")} aria-hidden="true">
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
