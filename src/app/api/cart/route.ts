import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, handle, localeFrom, parseJson, rateLimitRequest } from "@/lib/api";
import { MAX_CART_QTY } from "@/config/site";
import { addToCart, getCartView, setCartQuantity } from "@/features/cart/service";

export const dynamic = "force-dynamic";

/** GET /api/cart — current cart (user or guest) */
export const GET = handle(async (req: Request) => {
  return NextResponse.json({ ok: true, cart: await getCartView(localeFrom(req)) });
});

const addSchema = z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(MAX_CART_QTY).default(1) });

/** POST /api/cart — add { variantId, quantity } */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  rateLimitRequest(req, "cart", 120, 60_000);
  const body = await parseJson(req, addSchema);
  return NextResponse.json({ ok: true, cart: await addToCart(body.variantId, body.quantity, localeFrom(req)) });
});

const setSchema = z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(0).max(MAX_CART_QTY) });

/** PATCH /api/cart — set { variantId, quantity } (0 removes) */
export const PATCH = handle(async (req: Request) => {
  assertSameOrigin(req);
  rateLimitRequest(req, "cart", 120, 60_000);
  const body = await parseJson(req, setSchema);
  return NextResponse.json({ ok: true, cart: await setCartQuantity(body.variantId, body.quantity, localeFrom(req)) });
});
