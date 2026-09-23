import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

/** GET /api/session — minimal public view of the signed-in user (no secrets). */
export const GET = handle(async () => {
  const user = await getCurrentUser();
  return NextResponse.json({
    ok: true,
    user: user
      ? { firstName: user.firstName, email: user.email, isAdmin: hasPermission(user.permissions, "admin:access") }
      : null,
  });
});
