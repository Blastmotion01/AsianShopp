/**
 * Generates an illustrated SVG placeholder for a product that has no real photo yet.
 * The art is a stylized package (bag / can / cup / bar / box / jar) in the brand
 * palette with the product name — clearly an illustration, never a fake photo.
 */
export type PackShape = "bag" | "can" | "bottle" | "cup" | "bar" | "box" | "jar" | "mystery";

const PALETTES: Record<string, { bg: string; pack: string; accent: string; ink: string }> = {
  KR: { bg: "#FFE6EC", pack: "#FF9DB1", accent: "#F0573A", ink: "#2A1F24" },
  JP: { bg: "#FFF1E0", pack: "#FFE3C2", accent: "#F0573A", ink: "#2A1F24" },
  CN: { bg: "#FFE9E3", pack: "#F0573A", accent: "#FFE3C2", ink: "#FFFFFF" },
  US: { bg: "#EFEAE6", pack: "#2A1F24", accent: "#FF9DB1", ink: "#FFFFFF" },
  MIX: { bg: "#FFF4EA", pack: "#FF9DB1", accent: "#F0573A", ink: "#2A1F24" },
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrap(text: string, max = 14): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function shapePath(shape: PackShape, c: { pack: string; accent: string }) {
  switch (shape) {
    case "can":
      return `
        <rect x="215" y="150" width="170" height="320" rx="34" fill="${c.pack}"/>
        <rect x="225" y="138" width="150" height="26" rx="13" fill="#d9d2cc"/>
        <rect x="215" y="250" width="170" height="90" fill="${c.accent}" opacity=".9"/>
        <rect x="235" y="165" width="22" height="290" rx="11" fill="#fff" opacity=".35"/>`;
    case "bottle":
      return `
        <path d="M268 120h64v50c0 20 40 40 40 90v190c0 22-18 40-40 40h-64c-22 0-40-18-40-40V260c0-50 40-70 40-90z" fill="${c.pack}"/>
        <rect x="262" y="104" width="76" height="26" rx="10" fill="${c.accent}"/>
        <rect x="228" y="290" width="144" height="80" fill="${c.accent}" opacity=".85"/>
        <rect x="246" y="190" width="18" height="250" rx="9" fill="#fff" opacity=".35"/>`;
    case "cup":
      return `
        <path d="M190 180h220l-30 290c-2 18-17 30-35 30H255c-18 0-33-12-35-30z" fill="${c.pack}"/>
        <rect x="178" y="160" width="244" height="36" rx="18" fill="${c.accent}"/>
        <rect x="212" y="300" width="176" height="70" fill="${c.accent}" opacity=".8"/>
        <path d="M222 210h20l20 260h-18z" fill="#fff" opacity=".3"/>`;
    case "bar":
      return `
        <g transform="rotate(-12 300 300)">
          <rect x="140" y="220" width="320" height="170" rx="26" fill="${c.pack}"/>
          <rect x="140" y="220" width="70" height="170" rx="26" fill="${c.accent}"/>
          <rect x="390" y="220" width="70" height="170" rx="26" fill="${c.accent}"/>
          <rect x="220" y="240" width="160" height="16" rx="8" fill="#fff" opacity=".35"/>
        </g>`;
    case "box":
      return `
        <path d="M170 210l130-60 130 60v200l-130 70-130-70z" fill="${c.pack}"/>
        <path d="M300 270v210l130-70V210z" fill="#000" opacity=".12"/>
        <path d="M170 210l130 60 130-60-130-60z" fill="#fff" opacity=".35"/>
        <path d="M235 180l130 60v40l-130-60z" fill="${c.accent}"/>`;
    case "jar":
      return `
        <rect x="200" y="200" width="200" height="270" rx="44" fill="${c.pack}"/>
        <rect x="215" y="150" width="170" height="60" rx="16" fill="${c.accent}"/>
        <rect x="200" y="290" width="200" height="90" fill="#fff" opacity=".8"/>
        <rect x="222" y="220" width="18" height="230" rx="9" fill="#fff" opacity=".3"/>`;
    case "mystery":
      return `
        <path d="M160 230l140-60 140 60v190l-140 70-140-70z" fill="${c.pack}"/>
        <path d="M300 290v200l140-70V230z" fill="#000" opacity=".12"/>
        <path d="M160 230l140 60 140-60-140-60z" fill="#fff" opacity=".4"/>
        <path d="M285 176v308h30V176z" fill="${c.accent}"/>
        <path d="M300 172c-40-60-110-40-80 0 20 25 80 0 80 0zm0 0c40-60 110-40 80 0-20 25-80 0-80 0z" fill="${c.accent}"/>
        <text x="300" y="400" text-anchor="middle" font-size="120" font-weight="900" fill="#fff" font-family="Arial, sans-serif">?</text>`;
    case "bag":
    default:
      return `
        <path d="M190 150h220l-6 20c20 90 20 210 0 300l6 20H190l6-20c-20-90-20-210 0-300z" fill="${c.pack}"/>
        <path d="M190 150h220l-6 20H196zM190 490h220l-6-20H196z" fill="${c.accent}"/>
        <ellipse cx="300" cy="310" rx="80" ry="80" fill="${c.accent}" opacity=".9"/>
        <path d="M222 190c-12 90-12 200 0 270" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".35" fill="none"/>`;
  }
}

export function placeholderSvg(opts: { name: string; brand?: string; countryCode?: string | null; shape: PackShape }) {
  const c = PALETTES[opts.countryCode ?? "MIX"] ?? PALETTES.MIX;
  const lines = wrap(opts.name);
  const text = lines
    .map(
      (l, i) =>
        `<text x="300" y="${548 + i * 30 - (lines.length - 1) * 15}" text-anchor="middle" font-size="26" font-weight="800" fill="${c.ink === "#FFFFFF" ? "#2A1F24" : c.ink}" font-family="'Unbounded', 'Arial Rounded MT Bold', Arial, sans-serif">${esc(l)}</text>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${esc(opts.name)} — illustration">
  <defs>
    <radialGradient id="g" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".9"/>
      <stop offset="100%" stop-color="${c.bg}"/>
    </radialGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#2A1F24" flood-opacity=".18"/></filter>
  </defs>
  <rect width="600" height="600" fill="${c.bg}"/>
  <circle cx="300" cy="300" r="250" fill="url(#g)"/>
  <circle cx="110" cy="110" r="14" fill="${c.accent}" opacity=".5"/>
  <circle cx="500" cy="140" r="9" fill="${c.pack}"/>
  <circle cx="490" cy="470" r="18" fill="${c.accent}" opacity=".35"/>
  <g filter="url(#s)" transform="translate(0 -30)">${shapePath(opts.shape, c)}</g>
  ${opts.brand ? `<text x="300" y="88" text-anchor="middle" font-size="18" font-weight="700" letter-spacing="4" fill="${c.ink === "#FFFFFF" ? "#2A1F24" : c.ink}" opacity=".55" font-family="Arial, sans-serif">${esc(opts.brand.toUpperCase())}</text>` : ""}
  ${text}
</svg>`;
}

export function shapeForCategory(categorySlug: string, tags: string[] = []): PackShape {
  if (categorySlug === "mystery-box") return "mystery";
  if (categorySlug === "drinks") return tags.includes("bottle") ? "bottle" : "can";
  if (categorySlug === "noodles") return "cup";
  if (categorySlug === "chocolate") return "bar";
  if (categorySlug === "cookies") return "box";
  if (tags.includes("jar")) return "jar";
  return "bag";
}
