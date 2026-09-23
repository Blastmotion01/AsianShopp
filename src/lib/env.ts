import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  // Unset → vercel-blob when BLOB_READ_WRITE_TOKEN exists, otherwise local.
  STORAGE_PROVIDER: z
    .enum(["local", "vercel-blob", "cloudinary", "s3", "supabase"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  STORAGE_URL: z.string().default("/uploads"),
  STORAGE_LOCAL_DIR: z.string().default("storage/uploads"),
  PAYMENT_PROVIDER: z.string().default("mock"),
  NOTIFIER: z.string().default("console"),
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
