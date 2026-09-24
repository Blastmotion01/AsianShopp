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
  // Unset → vercel-blob when BLOB_READ_WRITE_TOKEN exists, otherwise local.
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
    cached = parsed.data;
  }
  return cached;
}
