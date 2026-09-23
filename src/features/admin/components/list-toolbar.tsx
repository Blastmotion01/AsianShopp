"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";

/**
 * Search box + select filters that write to the URL (server pages read searchParams).
 * `current` is passed from the server to avoid useSearchParams on the client.
 */
export function ListToolbar({
  current,
  placeholder,
  selects = [],
}: {
  current: Record<string, string | undefined>;
  placeholder: string;
  selects?: { name: string; label: string; options: { value: string; label: string }[] }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = React.useState(current.q ?? "");
  const [, start] = React.useTransition();

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...current, ...patch })) if (v && k !== "page") p.set(k, v);
    start(() => router.push(`${pathname}${p.toString() ? `?${p}` : ""}`));
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          push({ q });
        }}
        className="relative min-w-60 flex-1"
        role="search"
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <label className="sr-only" htmlFor="admin-q">
          {placeholder}
        </label>
        <input
          id="admin-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={() => q !== (current.q ?? "") && push({ q })}
          placeholder={placeholder}
          className="h-11 w-full rounded-full border-2 border-line bg-white pr-4 pl-9 text-sm outline-none focus:border-ink"
          maxLength={80}
        />
      </form>
      {selects.map((s) => (
        <label key={s.name} className="flex items-center gap-2">
          <span className="sr-only">{s.label}</span>
          <select
            value={current[s.name] ?? ""}
            onChange={(e) => push({ [s.name]: e.target.value })}
            className="h-11 rounded-full border-2 border-line bg-white px-4 text-sm font-semibold outline-none focus:border-ink"
            aria-label={s.label}
          >
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
