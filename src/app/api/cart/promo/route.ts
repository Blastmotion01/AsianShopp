import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, handle, localeFrom, parseJson, rateLimitRequest } from "@/lib/api";
import { applyPromoCode, removePromoCode } from "@/features/cart/service";

export const dynamic = "force-dynamic";

/** POST /api/cart/promo — apply { code } */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  rateLimitRequest(req, "promo", 15, 60_000); // slow down code guessing
  const { code } = await parseJson(req, z.object({ code: z.string().trim().min(1).max(40) }));
  return NextResponse.json({ ok: true, cart: await applyPromoCode(code, localeFrom(req)) });
});

/** DELETE /api/cart/promo — remove promo */
export const DELETE = handle(async (req: Request) => {
  assertSameOrigin(req);
  return NextResponse.json({ ok: true, cart: await removePromoCode(localeFrom(req)) });
});
