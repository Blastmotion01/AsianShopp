import type { ReactNode } from "react";
import "@/styles/globals.css";

// The <html> element lives in app/[locale]/layout.tsx so `lang` matches the locale.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
