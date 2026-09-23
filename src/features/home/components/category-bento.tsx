import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type CategoryTile = { href: string; name: string; emoji: string; color: string | null; count?: string; description?: string };

/** Asymmetric bento grid; first tile is large. Emoji art stands in for photography. */
export function CategoryBento({ tiles }: { tiles: CategoryTile[] }) {
  return (
    <ul className="grid auto-rows-[9.5rem] grid-cols-2 gap-3 md:auto-rows-[11rem] md:grid-cols-4 md:gap-4">
      {tiles.map((c, i) => (
        <li key={c.href} className={cn(i === 0 && "col-span-2 row-span-2", i === 5 && "md:col-span-2")}>
          <Link
            href={c.href}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-2 border-ink p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-pop md:p-5"
            style={{ backgroundColor: c.color ?? "#FFE3C2" }}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute -right-3 -bottom-4 leading-none transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12",
                i === 0 ? "text-[9rem] md:text-[12rem]" : "text-[4.5rem] md:text-[5.5rem]",
              )}
            >
              {c.emoji}
            </span>
            <span className="relative">
              <span className={cn("block font-display font-extrabold text-ink", i === 0 ? "text-3xl md:text-5xl" : "text-lg md:text-xl")}>
                <span className="rounded-md bg-white/70 box-decoration-clone px-1.5">{c.name}</span>
              </span>
              {i === 0 && c.description && <span className="mt-3 block max-w-xs font-semibold text-ink/80">{c.description}</span>}
            </span>
            {c.count && <span className="relative self-start rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink">{c.count}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
