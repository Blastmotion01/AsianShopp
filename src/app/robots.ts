import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
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
