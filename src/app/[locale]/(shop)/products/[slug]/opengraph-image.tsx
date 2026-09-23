import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/features/products/queries";
import type { Locale } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AsiaShop product";

/** Dynamic OG image per product (brand colours + name + price). Uses the English name for font coverage. */
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug, "en" as Locale);
  const name = p?.name ?? "AsiaShop";
  const price = p ? `${Math.round(p.price / 100)} UAH` : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFE3C2", padding: 60, fontFamily: "sans-serif" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: "6px solid #2A1F24",
            borderRadius: 48,
            padding: 56,
            boxShadow: "12px 12px 0 #2A1F24",
          }}
        >
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
            <span style={{ color: "#F0573A" }}>Asia</span>
            <span style={{ color: "#FF9DB1" }}>Shop</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, color: "#6F6368" }}>{p?.brand ?? ""}</div>
            <div style={{ fontSize: 72, fontWeight: 800, color: "#2A1F24", lineHeight: 1.05 }}>{name}</div>
          </div>
          <div style={{ display: "flex", alignSelf: "flex-start", background: "#F0573A", color: "#2A1F24", fontSize: 44, fontWeight: 800, padding: "12px 32px", borderRadius: 999, border: "5px solid #2A1F24" }}>
            {price}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
