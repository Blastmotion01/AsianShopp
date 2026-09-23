import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal-on-scroll using CSS scroll-driven animations (animation-timeline: view()).
 * Progressive enhancement: content is always visible when the browser lacks support,
 * JS is slow, or the user prefers reduced motion. Zero JS cost.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("reveal", className)}>{children}</div>;
}
