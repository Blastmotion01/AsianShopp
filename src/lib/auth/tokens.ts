import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** Session/reset tokens are stored hashed so a DB leak doesn't leak live sessions. */
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function sign(value: string, secret: string) {
  const mac = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${mac}`;
}

export function unsign(signed: string, secret: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = signed.slice(0, idx);
  const expected = Buffer.from(sign(value, secret));
  const actual = Buffer.from(signed);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return value;
}
