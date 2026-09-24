"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/auth/guards";
import { toActionError, type ActionResult } from "@/lib/errors";
import { findByCode, type ScanMatch } from "./service";

/** Looks up a scanned code. Returns the match, or null → the UI opens "new product". */
export async function lookupCodeAction(code: string): Promise<ActionResult<{ code: string; match: ScanMatch | null }>> {
  try {
    await requirePermission("products:write");
    const parsed = z.string().trim().min(1).max(64).parse(code);
    return { ok: true, data: { code: parsed, match: await findByCode(parsed) } };
  } catch (err) {
    return toActionError(err);
  }
}
