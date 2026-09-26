import "server-only";
import { z } from "zod";

/**
 * Simple text setting (provider ids etc.): trims spaces and stray quotes, lower-cases,
 * and falls back to the default when empty — values pasted into hosting dashboards
 * often carry such noise, and it must not break pages.
 */
const setting = (fallback: string) =>
  z
    .string()
    .optional()
    .transform((v) => v?.trim().replace(/^["']+|["']+$/g, "").trim().toLowerCase() || fallback);

const schema = z.object({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  // Unset → vercel-blob when a Blob token exists (see findBlobToken), otherwise local.
  STORAGE_PROVIDER: z
    .enum(["local", "vercel-blob", "cloudinary", "s3", "supabase"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  STORAGE_URL: z.string().default("/uploads"),
  STORAGE_LOCAL_DIR: z.string().default("storage/uploads"),
  PAYMENT_PROVIDER: setting("mock"),
  NOTIFIER: setting("console"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

let cached: z.infer<typeof schema> | null = null;

/** Validated server-side environment. Never import this from client components. */
export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Invalid environment variables:\n${issues}`);
    }
    cached = { ...parsed.data, BLOB_READ_WRITE_TOKEN: findBlobToken() };
  }
  return cached;
}

/**
 * Vercel names the Blob token after the prefix chosen when the store is connected
 * (BLOB_READ_WRITE_TOKEN by default, STORAGE_READ_WRITE_TOKEN, MY_PREFIX_READ_WRITE_TOKEN…).
 * Accept any of them — Blob tokens always start with "vercel_blob_rw_".
 */
function findBlobToken(): string | undefined {
  const clean = (v: string | undefined) => v?.trim().replace(/^["']+|["']+$/g, "").trim() || undefined;
  const direct = clean(process.env.BLOB_READ_WRITE_TOKEN);
  if (direct) return direct;
  for (const [key, value] of Object.entries(process.env)) {
    const v = clean(value);
    if (key.endsWith("READ_WRITE_TOKEN") && v?.startsWith("vercel_blob_rw_")) return v;
  }
  return undefined;
}
