"use server";

import { revalidateStorefront } from "@/lib/revalidate";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { toActionError, zodFieldErrors } from "@/lib/errors";
import type { FormState } from "@/lib/forms";

const schema = z.object({
  productId: z.string().min(1).max(40),
  rating: z.coerce.number().int().min(1, "required").max(5),
  body: z.string().trim().min(3, "required").max(1000, "tooLong"),
});

export async function createReviewAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ productId: fd.get("productId"), rating: fd.get("rating"), body: fd.get("body") });
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    const user = await requireUser();
    await enforceRateLimit("review", 5, 60_000);
    const product = await db.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, slug: true, isActive: true } });
    if (!product?.isActive) return { error: "product_unavailable" };
    const exists = await db.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } });
    if (exists) return { error: "already_reviewed" };
    const locale = await getLocale();
    await db.$transaction(async (tx) => {
      await tx.review.create({ data: { productId: product.id, userId: user.id, rating: parsed.data.rating, body: parsed.data.body, locale } });
      const agg = await tx.review.aggregate({ where: { productId: product.id, isPublished: true }, _avg: { rating: true }, _count: true });
      await tx.product.update({
        where: { id: product.id },
        data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
      });
    });
    revalidateStorefront();
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}
