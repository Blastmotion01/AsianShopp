import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/features/products/queries";
import { db } from "@/lib/db";

export const revalidate = 3600;

const LOCALE_PREFIX = { uk: "", ru: "/ru", en: "/en" } as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const entry = (path: string, lastModified?: Date, priority = 0.7): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path || "/"}`,
    lastModified,
    priority,
    alternates: {
      languages: Object.fromEntries(Object.entries(LOCALE_PREFIX).map(([l, p]) => [l, `${base}${p}${path}`])),
    },
  });

  const [products, categories, countries] = await Promise.all([
    getAllProductSlugs(),
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.country.findMany({ select: { code: true } }),
  ]);

  return [
    entry("", undefined, 1),
    entry("/products", undefined, 0.9),
    entry("/snack-match", undefined, 0.6),
    entry("/mystery-box", undefined, 0.7),
    ...categories.map((c) => entry(`/products?category=${c.slug}`, undefined, 0.6)),
    ...countries.map((c) => entry(`/products?country=${c.code}`, undefined, 0.6)),
    ...products.map((p) => entry(`/products/${p.slug}`, p.updatedAt, 0.8)),
  ];
}
