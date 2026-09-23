import { cn } from "@/lib/utils";

/**
 * Inline SVG flags (simplified). Emoji flags don't render on Windows,
 * so we never rely on them in UI.
 */
export function Flag({ code, className, title }: { code: string | null | undefined; className?: string; title?: string }) {
  const cls = cn("inline-block h-[0.8em] w-[1.2em] shrink-0 rounded-[3px] align-[-0.08em] shadow-[0_0_0_1px_rgb(42_31_36/0.15)]", className);
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };
  switch (code) {
    case "KR":
      return (
        <svg viewBox="0 0 30 20" className={cls} {...a11y}>
          <rect width="30" height="20" fill="#fff" />
          <g transform="translate(15 10) rotate(-33.7)">
            <path d="M-5 0a5 5 0 0 1 10 0z" fill="#CD2E3A" />
            <path d="M-5 0a5 5 0 0 0 10 0z" fill="#0047A0" />
            <circle cx="-2.5" cy="0" r="2.5" fill="#CD2E3A" />
            <circle cx="2.5" cy="0" r="2.5" fill="#0047A0" />
          </g>
          <g fill="#000">
            <rect x="4" y="3" width="4.5" height="0.9" transform="rotate(34 6.2 3.5)" />
            <rect x="4" y="4.5" width="4.5" height="0.9" transform="rotate(34 6.2 5)" />
            <rect x="21.5" y="14.2" width="4.5" height="0.9" transform="rotate(34 23.7 14.6)" />
            <rect x="21.5" y="15.7" width="4.5" height="0.9" transform="rotate(34 23.7 16.1)" />
            <rect x="21.5" y="3" width="4.5" height="0.9" transform="rotate(-34 23.7 3.5)" />
            <rect x="21.5" y="4.5" width="4.5" height="0.9" transform="rotate(-34 23.7 5)" />
            <rect x="4" y="14.2" width="4.5" height="0.9" transform="rotate(-34 6.2 14.6)" />
            <rect x="4" y="15.7" width="4.5" height="0.9" transform="rotate(-34 6.2 16.1)" />
          </g>
        </svg>
      );
    case "JP":
      return (
        <svg viewBox="0 0 30 20" className={cls} {...a11y}>
          <rect width="30" height="20" fill="#fff" />
          <circle cx="15" cy="10" r="6" fill="#BC002D" />
        </svg>
      );
    case "CN":
      return (
        <svg viewBox="0 0 30 20" className={cls} {...a11y}>
          <rect width="30" height="20" fill="#DE2910" />
          <path fill="#FFDE00" d="M5 2.5l1.1 3.4h3.6l-2.9 2.1 1.1 3.4L5 9.3l-2.9 2.1 1.1-3.4L.3 5.9h3.6z" />
          <circle cx="11" cy="2.5" r="0.9" fill="#FFDE00" />
          <circle cx="13" cy="4.6" r="0.9" fill="#FFDE00" />
          <circle cx="13" cy="7.6" r="0.9" fill="#FFDE00" />
          <circle cx="11" cy="9.6" r="0.9" fill="#FFDE00" />
        </svg>
      );
    case "US":
      return (
        <svg viewBox="0 0 30 20" className={cls} {...a11y}>
          <rect width="30" height="20" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
          ))}
          <rect width="13" height={(20 / 13) * 7} fill="#3C3B6E" />
          <g fill="#fff">
            {[2, 5, 8, 11].map((x) => [2, 5, 8].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" />))}
          </g>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 30 20" className={cls} {...a11y}>
          <rect width="30" height="20" rx="3" fill="#FFE3C2" />
          <circle cx="10" cy="10" r="4" fill="#F0573A" />
          <circle cx="20" cy="10" r="4" fill="#FF9DB1" />
        </svg>
      );
  }
}
