import Link from "next/link";
import { manrope, unbounded } from "@/lib/fonts";

// Fallback for paths outside any locale. Localized 404 lives in app/[locale]/not-found.tsx.
export default function GlobalNotFound() {
  return (
    <html lang="uk" className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="grid min-h-dvh place-items-center bg-neutral p-6 text-center">
        <div>
          <p className="font-display text-7xl font-extrabold text-coral-500">404</p>
          <p className="mt-4 text-lg">Сторінку не знайдено · Page not found</p>
          <Link href="/" className="mt-6 inline-block font-semibold text-coral-700 underline">
            AsiaShop →
          </Link>
        </div>
      </body>
    </html>
  );
}
