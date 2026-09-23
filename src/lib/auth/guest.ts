import "server-only";
import { cookies } from "next/headers";
import { COOKIE } from "@/config/site";
import { env } from "@/lib/env";
import { randomToken, sign, unsign } from "./tokens";

const GUEST_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

/** Reads the signed guest id (anonymous cart / wishlist owner). */
export async function readGuestId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE.guest)?.value;
  if (!raw) return null;
  return unsign(raw, env().AUTH_SECRET);
}

/** Returns the guest id, creating the cookie if needed. Actions / route handlers only. */
export async function ensureGuestId(): Promise<string> {
  const existing = await readGuestId();
  if (existing) return existing;
  const id = randomToken(18);
  (await cookies()).set(COOKIE.guest, sign(id, env().AUTH_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + GUEST_TTL_MS),
  });
  return id;
}

export async function clearGuestId() {
  (await cookies()).delete(COOKIE.guest);
}
