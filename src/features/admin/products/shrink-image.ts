/**
 * Phone photos are often 4–10 MB, over the server upload limit (and Vercel's 4.5 MB request
 * body cap). Scale big images down in the browser to at most MAX_SIDE px (JPEG) before upload.
 * EXIF orientation is applied; transparent areas become white (removed later by the stylizer).
 * Falls back to the original file if the browser can't decode it.
 */
const MAX_SIDE = 2000;
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;

export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= SKIP_BELOW_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
