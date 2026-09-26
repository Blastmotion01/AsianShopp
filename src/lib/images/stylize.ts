import sharp from "sharp";

/**
 * Turns a product photo on a plain light background into a catalog image in the
 * site's placeholder style: background removed, product centred on the country
 * colour with a soft glow, decorative dots and a drop shadow. 800×800 webp.
 *
 * Background removal = region growing from the image border over light,
 * low-saturation pixels (works for studio/white/grey backgrounds, not for busy scenes).
 *
 * Used by the admin upload (src/features/admin/products/actions.ts) and by
 * scripts/stylize-photo.ts.
 */

/**
 * plain — flood fill only;
 * hull  — WHITE packaging on a white background: keep everything inside the convex hull
 *         of the coloured parts (bottles, cups, boxes);
 * box   — rectangular white bags whose edges have no print: keep the rounded bounding box;
 * auto  — plain, or hull when the flood fill clearly ate into the pack.
 */
export type StylizeMode = "auto" | "plain" | "hull" | "box";

// Same palette as src/lib/placeholder-art.ts
const PALETTES: Record<string, { bg: string; pack: string; accent: string }> = {
  KR: { bg: "#FFE6EC", pack: "#FF9DB1", accent: "#F0573A" },
  JP: { bg: "#FFF1E0", pack: "#FFE3C2", accent: "#F0573A" },
  CN: { bg: "#FFE9E3", pack: "#F0573A", accent: "#FFE3C2" },
  US: { bg: "#EFEAE6", pack: "#2A1F24", accent: "#FF9DB1" },
  MIX: { bg: "#FFF4EA", pack: "#FF9DB1", accent: "#F0573A" },
};
const SIZE = 800;
/** Longer side the photo is reduced to before processing (speed; the output is 800 px anyway). */
const WORK_SIZE = 1400;
/** Less than this share of the image recognised as background → no plain background, give up. */
const MIN_REMOVED = 0.04;
/** auto: foreground covers less than this share of its convex hull → the white pack was eaten. */
const HULL_RATIO = 0.85;

export type StylizeResult = { image: Buffer; removed: number; mode: Exclude<StylizeMode, "auto"> };

/** Returns null when no plain light background was found (the photo should be used as is). */
export async function stylizeProductPhoto(input: Buffer, opts: { country?: string | null; mode?: StylizeMode } = {}): Promise<StylizeResult | null> {
  const c = PALETTES[opts.country ?? "MIX"] ?? PALETTES.MIX;
  const cut = await cutout(input, opts.mode ?? "auto");
  if (!cut) return null;

  const trimmed = await cut.image.trim({ threshold: 1 }).toBuffer();
  // product fits a 560×560 box (70% of the canvas), never upscaled more than 2×
  const meta = await sharp(trimmed).metadata();
  const box = Math.round(SIZE * 0.7);
  const scale = Math.min(box / meta.width, box / meta.height, 2);
  const pw = Math.max(1, Math.round(meta.width * scale));
  const ph = Math.max(1, Math.round(meta.height * scale));
  const product = await sharp(trimmed).resize(pw, ph, { kernel: "lanczos3" }).png().toBuffer();

  // soft drop shadow from the silhouette (same feel as the placeholder's feDropShadow)
  const silhouetteAlpha = await sharp(product).extractChannel("alpha").toBuffer();
  const shadowPad = 40;
  const shadowBlurred = await sharp(
    await sharp({ create: { width: pw, height: ph, channels: 3, background: "#2A1F24" } })
      .joinChannel(silhouetteAlpha)
      .png()
      .toBuffer(),
  )
    .extend({ top: shadowPad, bottom: shadowPad, left: shadowPad, right: shadowPad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .blur(16)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: sd, info: si } = shadowBlurred;
  for (let i = 3; i < sd.length; i += 4) sd[i] = Math.round(sd[i] * 0.22);
  const shadowLayer = await sharp(sd, { raw: { width: si.width, height: si.height, channels: 4 } }).png().toBuffer();

  const left = Math.round((SIZE - pw) / 2);
  const top = Math.round((SIZE - ph) / 2) - 10;
  const image = await sharp(backgroundSvg(c))
    .composite([
      { input: shadowLayer, left: left - shadowPad, top: top - shadowPad + 22 },
      { input: product, left, top },
    ])
    .webp({ quality: 88 })
    .toBuffer();
  return { image, removed: cut.removed, mode: cut.mode };
}

/** Cut out: flood-fill the light background from the borders. */
async function cutout(input: Buffer, mode: StylizeMode) {
  const { data, info } = await sharp(input)
    .rotate() // phone photos: apply EXIF orientation
    .resize(WORK_SIZE, WORK_SIZE, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isBgLike = (i: number) => {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) <= 26 && (r + g + b) / 3 >= 170;
  };
  const diff = (i: number, j: number) =>
    (Math.abs(data[i * 3] - data[j * 3]) + Math.abs(data[i * 3 + 1] - data[j * 3 + 1]) + Math.abs(data[i * 3 + 2] - data[j * 3 + 2])) / 3;

  let bg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const seed = (i: number) => {
    if (!bg[i] && isBgLike(i)) {
      bg[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    // grow only through smooth light areas (handles gradients, stops at edges)
    const visit = (j: number) => {
      if (!bg[j] && isBgLike(j) && diff(i, j) <= 14) {
        bg[j] = 1;
        queue[tail++] = j;
      }
    };
    if (x + 1 < w) visit(i + 1);
    if (x > 0) visit(i - 1);
    if (i + w < w * h) visit(i + w);
    if (i >= w) visit(i - w);
  }

  const removed = tail / (w * h);
  if (removed < MIN_REMOVED || removed > 0.98) return null;

  let used: Exclude<StylizeMode, "auto"> = mode === "auto" ? "plain" : mode;
  if (mode === "hull" || mode === "box" || mode === "auto") {
    const filled = bg.slice();
    if (mode === "box") fillBoundingBox(filled, w, h);
    else fillConvexHull(filled, w, h);
    if (mode === "auto") {
      const fg = w * h - tail;
      const fgHull = filled.reduce((s, v) => s + (v ? 0 : 1), 0);
      if (fgHull > 0 && fg / fgHull < HULL_RATIO) {
        bg = filled;
        used = "hull";
      }
    } else bg = filled;
  }

  // Alpha: 0 for background; product pixels that touch the background get a softened
  // value (3×3 average) so the cut edge isn't jagged.
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let a = 0;
      if (!bg[i]) {
        let fg = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            n++;
            if (!bg[ny * w + nx]) fg++;
          }
        }
        a = Math.round((fg / n) * 255);
      }
      rgba[i * 4] = data[i * 3];
      rgba[i * 4 + 1] = data[i * 3 + 1];
      rgba[i * 4 + 2] = data[i * 3 + 2];
      rgba[i * 4 + 3] = a;
    }
  }
  return { image: sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png(), removed, mode: used };
}

/** Marks everything inside the convex hull of the foreground as foreground (bg[i] = 0). */
function fillConvexHull(bg: Uint8Array, w: number, h: number) {
  // extreme foreground points per row are enough to build the hull
  const pts: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    let minX = -1;
    let maxX = -1;
    for (let x = 0; x < w; x++) {
      if (!bg[y * w + x]) {
        if (minX < 0) minX = x;
        maxX = x;
      }
    }
    if (minX >= 0) pts.push([minX, y], [maxX, y]);
  }
  if (pts.length < 3) return;
  // Andrew's monotone chain
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  // scanline polygon fill
  for (let y = 0; y < h; y++) {
    const xs: number[] = [];
    for (let i = 0; i < hull.length; i++) {
      const [x1, y1] = hull[i];
      const [x2, y2] = hull[(i + 1) % hull.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) bg[y * w + x] = 0;
    }
  }
}

/** Marks the padded, rounded bounding box of the foreground as foreground. */
function fillBoundingBox(bg: Uint8Array, w: number, h: number) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!bg[y * w + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return;
  const pad = Math.round(Math.min(w, h) * 0.015);
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const r = Math.round(Math.min(x1 - x0, y1 - y0) * 0.05); // corner radius
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
      const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) bg[y * w + x] = 0;
    }
  }
}

/** Background in the placeholder style. */
function backgroundSvg(c: { bg: string; pack: string; accent: string }) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="${SIZE}" height="${SIZE}">
  <defs><radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".9"/><stop offset="100%" stop-color="${c.bg}"/></radialGradient></defs>
  <rect width="600" height="600" fill="${c.bg}"/>
  <circle cx="300" cy="300" r="250" fill="url(#g)"/>
  <circle cx="110" cy="110" r="14" fill="${c.accent}" opacity=".5"/>
  <circle cx="500" cy="140" r="9" fill="${c.pack}"/>
  <circle cx="490" cy="470" r="18" fill="${c.accent}" opacity=".35"/>
</svg>`);
}
