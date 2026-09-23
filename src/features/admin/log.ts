import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";

/** Audit trail for admin actions (who, what, which entity, when). */
export async function logAdminAction(
  user: CurrentUser,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
) {
  try {
    await db.adminLog.create({
      data: {
        userId: user.id,
        userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        action,
        entity,
        entityId: entityId ?? null,
        details: details as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    // Logging must never break the admin action itself.
    console.error("[admin-log]", err);
  }
}
