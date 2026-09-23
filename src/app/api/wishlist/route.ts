import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, handle, parseJson, rateLimitRequest } from "@/lib/api";
import { getWishlistIds, toggleWishlist } from "@/features/wishlist/service";

export const dynamic = "force-dynamic";

/** GET /api/wishlist — product ids in the wishlist */
export const GET = handle(async () => {
  return NextResponse.json({ ok: true, ids: await getWishlistIds() });
});

/** POST /api/wishlist — toggle { productId } */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  rateLimitRequest(req, "wishlist", 120, 60_000);
  const { productId } = await parseJson(req, z.object({ productId: z.string().min(1).max(40) }));
  return NextResponse.json({ ok: true, ...(await toggleWishlist(productId)) });
});
