import { db } from "@/lib/db";
import { placeholderSvg, shapeForCategory } from "@/lib/placeholder-art";

/**
 * GET /placeholders/<product-slug>.svg — illustrated placeholder generated on the fly
 * from product data. Nothing is stored, so it works on read-only hosting (Vercel).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const slug = file.replace(/\.svg$/, "");
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return new Response("Not found", { status: 404 });

  const p = await db.product.findUnique({
    where: { slug },
    select: {
      tags: true,
      brand: { select: { name: true } },
      country: { select: { code: true } },
      category: { select: { slug: true } },
      translations: { where: { locale: { in: ["en", "uk"] } }, select: { locale: true, name: true } },
    },
  });
  if (!p) return new Response("Not found", { status: 404 });

  const name = (p.translations.find((t) => t.locale === "en") ?? p.translations[0])?.name ?? slug;
  const svg = placeholderSvg({ name, brand: p.brand?.name, countryCode: p.country?.code, shape: shapeForCategory(p.category.slug, p.tags) });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
