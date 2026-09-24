import "server-only";
import { db } from "@/lib/db";
import { normalizeBarcode } from "@/features/admin/products/schema";

export type ScanMatch = { productId: string; variantId: string; name: string; sku: string; stock: number; matchedBy: "barcode" | "sku" };

/** Finds a variant by its package barcode, falling back to the SKU (for own printed labels). */
export async function findByCode(raw: string): Promise<ScanMatch | null> {
  const code = normalizeBarcode(raw);
  if (!code || code.length > 64) return null;
  const include = { inventory: true, product: { include: { translations: { where: { locale: "uk" } } } } } as const;

  let matchedBy: ScanMatch["matchedBy"] = "barcode";
  let v = await db.productVariant.findUnique({ where: { barcode: code }, include });
  if (!v) {
    v = await db.productVariant.findFirst({ where: { sku: { equals: code, mode: "insensitive" } }, include });
    matchedBy = "sku";
  }
  if (!v) return null;
  return {
    productId: v.productId,
    variantId: v.id,
    name: v.product.translations[0]?.name ?? v.product.slug,
    sku: v.sku,
    stock: v.inventory?.quantity ?? 0,
    matchedBy,
  };
}
