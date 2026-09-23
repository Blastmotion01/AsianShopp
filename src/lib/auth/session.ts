import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { COOKIE } from "@/config/site";
import { hashToken, randomToken } from "./tokens";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  role: string;
  permissions: string[];
};

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

/** Creates a DB session and sets the cookie. Only callable from actions / route handlers. */
export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const ua = (await headers()).get("user-agent")?.slice(0, 250) ?? null;
  await db.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt, userAgent: ua } });
  (await cookies()).set(COOKIE.session, token, cookieOptions(expiresAt));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE.session)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  store.delete(COOKIE.session);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/** Returns the signed-in user for this request (memoized per request). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE.session)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { role: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role.key,
    permissions: u.role.permissions,
  };
});
