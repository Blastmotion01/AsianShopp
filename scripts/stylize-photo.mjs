/**
 * Turns a product photo on a plain light background into a catalog image in the
 * site's placeholder style: background removed, product centred on the country
 * colour with a soft glow, decorative dots and a drop shadow.
 *
 *   node scripts/stylize-photo.mjs <input> <slug> <countryCode|MIX> [--debug]
 *   → public/product-photos/<slug>.webp  (800×800)
 *
 * Background removal = region growing from the image border over light,
 * low-saturation pixels (works for studio/white/grey backgrounds, not for busy scenes).
 */
import sharp from "sharp";
import path from "node:path";

const [input, slug, country = "MIX", ...flags] = process.argv.slice(2);
if (!input || !slug) {
  console.error("usage: node scripts/stylize-photo.mjs <input> <slug> <KR|JP|CN|US|MIX> [--debug]");
  process.exit(1);
}
const debug = flags.includes("--debug");

// Same palette as src/lib/placeholder-art.ts
const PALETTES = {
  KR: { bg: "#FFE6EC", pack: "#FF9DB1", accent: "#F0573A" },
  JP: { bg: "#FFF1E0", pack: "#FFE3C2", accent: "#F0573A" },
  CN: { bg: "#FFE9E3", pack: "#F0573A", accent: "#FFE3C2" },
  US: { bg: "#EFEAE6", pack: "#2A1F24", accent: "#FF9DB1" },
  MIX: { bg: "#FFF4EA", pack: "#FF9DB1", accent: "#F0573A" },
};
const c = PALETTES[country] ?? PALETTES.MIX;
const SIZE = 800;

/** 1) Cut out: flood-fill the light background from the borders. */
async function cutout(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const isBgLike = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) <= 26 && (r + g + b) / 3 >= 170;
  const diff = (a, b) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3;

  const bg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const seed = (x, y) => {
    const i = y * w + x;
    if (!bg[i] && isBgLike(px(i))) {
      bg[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x, 0);
    seed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    seed(0, y);
    seed(w - 1, y);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    const y = (i - x) / w;
    const cur = px(i);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (bg[j]) continue;
      const p = px(j);
      // grow only through smooth light areas (handles gradients, stops at edges)
      if (isBgLike(p) && diff(p, cur) <= 14) {
        bg[j] = 1;
        queue[tail++] = j;
      }
    }
  }

  // Alpha: 0 for background; product pixels that touch the background get a softened
  // value (3×3 average) so the cut edge isn't jagged. Done by hand to keep 1 value/pixel.
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
  const removed = bg.reduce((s, v) => s + v, 0) / (w * h);
  return { image: sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png(), removed };
}

/** 2) Background in the placeholder style. */
function backgroundSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="${SIZE}" height="${SIZE}">
  <defs><radialGradient id="g" cx="35%" cy="30%" r="80%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".9"/><stop offset="100%" stop-color="${c.bg}"/></radialGradient></defs>
  <rect width="600" height="600" fill="${c.bg}"/>
  <circle cx="300" cy="300" r="250" fill="url(#g)"/>
  <circle cx="110" cy="110" r="14" fill="${c.accent}" opacity=".5"/>
  <circle cx="500" cy="140" r="9" fill="${c.pack}"/>
  <circle cx="490" cy="470" r="18" fill="${c.accent}" opacity=".35"/>
</svg>`);
}

async function main() {
  const { image, removed } = await cutout(input);
  const trimmed = await image.trim({ threshold: 1 }).toBuffer();
  // product fits a 560×560 box (70% of the canvas), never upscaled more than 2×
  const meta = await sharp(trimmed).metadata();
  const box = Math.round(SIZE * 0.7);
  const scale = Math.min(box / meta.width, box / meta.height, 2);
  const pw = Math.round(meta.width * scale);
  const ph = Math.round(meta.height * scale);
  const product = await sharp(trimmed).resize(pw, ph, { kernel: "lanczos3" }).png().toBuffer();

  // soft drop shadow from the silhouette (same feel as the placeholder's feDropShadow)
  const silhouetteAlpha = await sharp(product).extractChannel("alpha").toBuffer();
  const shadow = await sharp({ create: { width: pw, height: ph, channels: 3, background: "#2A1F24" } })
    .joinChannel(silhouetteAlpha)
    .png()
    .toBuffer();
  const shadowPad = 40;
  const shadowBlurred = await sharp(shadow)
    .extend({ top: shadowPad, bottom: shadowPad, left: shadowPad, right: shadowPad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .blur(16)
    .ensureAlpha(0.22)
    .png()
    .toBuffer();
  // lower the shadow opacity
  const { data: sd, info: si } = await sharp(shadowBlurred).raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < sd.length; i += 4) sd[i] = Math.round(sd[i] * 0.22);
  const shadowLayer = await sharp(sd, { raw: { width: si.width, height: si.height, channels: 4 } }).png().toBuffer();

  const left = Math.round((SIZE - pw) / 2);
  const top = Math.round((SIZE - ph) / 2) - 10;
  const out = path.resolve("public/product-photos", `${slug}.webp`);
  await sharp(backgroundSvg())
    .composite([
      { input: shadowLayer, left: left - shadowPad, top: top - shadowPad + 22 },
      { input: product, left, top },
    ])
    .webp({ quality: 88 })
    .toFile(out);

  if (debug) await sharp(trimmed).toFile(path.resolve(process.env.DEBUG_DIR ?? ".", `${slug}-cutout.png`));
  console.log(`✓ ${slug}: background removed ${(removed * 100).toFixed(0)}%, product ${pw}×${ph} → ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
