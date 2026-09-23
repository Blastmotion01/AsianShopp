import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Invalidates cached storefront pages (ISR) after catalog / CMS / review changes.
 * Store edits are infrequent, so invalidating the whole tree keeps things simple and correct
 * across all locales and route groups.
 */
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
