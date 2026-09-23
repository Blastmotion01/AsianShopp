import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const privatePaths = ["/admin", "/account", "/checkout", "/api/", "/login", "/register", "/forgot-password", "/reset-password", "/wishlist"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...privatePaths, ...privatePaths.flatMap((p) => [`/ru${p}`, `/en${p}`])],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
