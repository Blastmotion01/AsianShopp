import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/integrations/payments";
import { applyPaymentStatus } from "@/features/orders/service";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/:provider/webhook — server-to-server payment callbacks.
 * Each provider verifies its own signature in parseWebhook().
 */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await ctx.params;
  let provider;
  try {
    provider = getPaymentProvider(id);
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const result = await provider.parseWebhook(req);
    await applyPaymentStatus(result.providerRef, result.status, result.raw);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[webhook:${id}]`, err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
