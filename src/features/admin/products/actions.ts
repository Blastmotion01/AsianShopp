"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { toActionError, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { revalidateStorefront } from "@/lib/revalidate";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, getStorage, sniffImageType } from "@/lib/integrations/storage";
import { logAdminAction } from "@/features/admin/log";
import { productInputSchema, type ProductInput } from "./schema";
import { deleteProducts, duplicateProduct, saveProduct } from "./service";

export async function saveProductAction(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requirePermission("products:write");
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
    const before = parsed.data.id ? await db.product.findUnique({ where: { id: parsed.data.id }, select: { price: true, isActive: true } }) : null;
    const product = await saveProduct(parsed.data, [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email);
    await logAdminAction(user, parsed.data.id ? "product.update" : "product.create", "Product", product.id, {
      slug: product.slug,
      ...(before && before.price !== product.price ? { priceFrom: before.price, priceTo: product.price } : {}),
      ...(before && before.isActive !== product.isActive ? { active: product.isActive } : {}),
    });
    revalidateStorefront();
    return { ok: true, data: { id: product.id, slug: product.slug } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteProductsAction(ids: string[]): Promise<ActionResult<{ deleted: number; skipped: number }>> {
  try {
    const user = await requirePermission("products:write");
    const list = z.array(z.string().max(40)).min(1).max(200).parse(ids);
    const res = await deleteProducts(list);
    for (const id of res.deleted) await logAdminAction(user, "product.delete", "Product", id);
    revalidateStorefront();
    return { ok: true, data: { deleted: res.deleted.length, skipped: res.skipped.length } };
  } catch (err) {
    return toActionError(err);
  }
}

export async function duplicateProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission("products:write");
    const copy = await duplicateProduct(z.string().max(40).parse(id));
    await logAdminAction(user, "product.duplicate", "Product", copy.id, { from: id });
    return { ok: true, data: { id: copy.id } };
  } catch (err) {
    return toActionError(err);
  }
}

const bulkSchema = z.object({ ids: z.array(z.string().max(40)).min(1).max(200), op: z.enum(["activate", "deactivate", "feature", "unfeature"]) });

export async function bulkUpdateProductsAction(input: z.input<typeof bulkSchema>): Promise<ActionResult<{ updated: number }>> {
  try {
    const user = await requirePermission("products:write");
    const { ids, op } = bulkSchema.parse(input);
    const data = { activate: { isActive: true }, deactivate: { isActive: false }, feature: { isFeatured: true }, unfeature: { isFeatured: false } }[op];
    const res = await db.product.updateMany({ where: { id: { in: ids } }, data });
    await logAdminAction(user, `product.bulk_${op}`, "Product", null, { ids });
    revalidateStorefront();
    return { ok: true, data: { updated: res.count } };
  } catch (err) {
    return toActionError(err);
  }
}

/** Uploads one product image through the configured StorageProvider. Validates by magic bytes. */
export async function uploadProductImageAction(fd: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    await requirePermission("products:write");
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMAGE_BYTES) return { ok: false, error: "invalid_file" };
    const buf = Buffer.from(await file.arrayBuffer());
    const type = sniffImageType(buf);
    if (!type || !ALLOWED_IMAGE_TYPES[type]) return { ok: false, error: "invalid_file" };
    const url = await getStorage().put("products", file.name, buf, type);
    return { ok: true, data: { url } };
  } catch (err) {
    return toActionError(err);
  }
}
