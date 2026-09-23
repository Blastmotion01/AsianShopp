import { NextResponse } from "next/server";
import { handle, localeFrom, rateLimitRequest } from "@/lib/api";
import { searchSuggest } from "@/features/products/queries";

/** GET /api/search?q=...&locale=uk — autocomplete suggestions */
export const GET = handle(async (req: Request) => {
  rateLimitRequest(req, "search", 120, 60_000);
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });
  const items = await searchSuggest(q, localeFrom(req));
  return NextResponse.json(
    { ok: true, items: items.map((p) => ({ id: p.id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, image: p.image, countryCode: p.country?.code ?? null })) },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
});
