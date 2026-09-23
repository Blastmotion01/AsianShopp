import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { randomToken } from "@/lib/auth/tokens";

/**
 * File storage abstraction: local disk (dev / VPS) or Vercel Blob (Vercel).
 * Cloudinary / S3 / Supabase Storage can implement the same interface.
 */
export interface StorageProvider {
  readonly id: string;
  /** Saves a file and returns its public URL. */
  put(folder: string, filename: string, data: Buffer, contentType: string): Promise<string>;
  delete(url: string): Promise<void>;
}

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function localRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), env().STORAGE_LOCAL_DIR);
}

class LocalStorageProvider implements StorageProvider {
  readonly id = "local";

  async put(folder: string, filename: string, data: Buffer, contentType: string) {
    const ext = ALLOWED_IMAGE_TYPES[contentType] ?? path.extname(filename).slice(1) ?? "bin";
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const name = `${Date.now()}-${randomToken(6)}.${ext}`;
    const dir = path.join(/*turbopackIgnore: true*/ localRoot(), safeFolder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), data);
    return `${env().STORAGE_URL}/${safeFolder}/${name}`;
  }

  async delete(url: string) {
    const base = env().STORAGE_URL;
    if (!url.startsWith(base + "/")) return;
    const rel = url.slice(base.length + 1);
    const full = path.resolve(/*turbopackIgnore: true*/ localRoot(), rel);
    if (!full.startsWith(localRoot())) return; // path traversal guard
    await fs.unlink(full).catch(() => {});
  }
}

/** Vercel Blob — for Vercel / serverless hosting where the disk is read-only. */
class VercelBlobStorageProvider implements StorageProvider {
  readonly id = "vercel-blob";

  async put(folder: string, _filename: string, data: Buffer, contentType: string) {
    const { put } = await import("@vercel/blob");
    const ext = ALLOWED_IMAGE_TYPES[contentType] ?? "bin";
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const blob = await put(`${safeFolder}/${Date.now()}-${randomToken(6)}.${ext}`, data, {
      access: "public",
      contentType,
      token: env().BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  async delete(url: string) {
    if (!url.includes(".blob.vercel-storage.com/")) return;
    const { del } = await import("@vercel/blob");
    await del(url, { token: env().BLOB_READ_WRITE_TOKEN }).catch(() => {});
  }
}

/**
 * STORAGE_PROVIDER=local | vercel-blob. When unset, Vercel Blob is used automatically
 * if BLOB_READ_WRITE_TOKEN is present (Vercel adds it when a Blob store is connected).
 */
export function getStorage(): StorageProvider {
  const e = env();
  const id = e.STORAGE_PROVIDER ?? (e.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local");
  if (id === "vercel-blob") {
    if (!e.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN is required for vercel-blob storage");
    return new VercelBlobStorageProvider();
  }
  if (id !== "local") throw new Error(`Storage provider "${id}" is not implemented yet`);
  return new LocalStorageProvider();
}

/** Detects image type from magic bytes — don't trust the client-provided MIME type. */
export function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString("ascii").startsWith("ftypavi")) return "image/avif";
  return null;
}
