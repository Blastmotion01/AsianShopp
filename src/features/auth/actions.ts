"use server";

import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession } from "@/lib/auth/session";
import { hashToken, randomToken } from "@/lib/auth/tokens";
import { requireUser } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { toActionError, zodFieldErrors } from "@/lib/errors";
import { formToObject, type FormState } from "@/lib/forms";
import { notify } from "@/lib/integrations/notifications";
import { mergeGuestIntoUser } from "@/features/cart/service";
import { isLocale } from "@/lib/localized";
import {
  changePasswordSchema,
  forgotSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetSchema,
  safeNext,
} from "./schemas";

// A real bcrypt hash of a random string: used to keep login timing constant for unknown emails.
const DUMMY_HASH = "$2b$12$bLvctK.GZ70vSGDPcISv9O27x4yv3jnRYXYkL0WN9V75PRkPhCXca";

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    await enforceRateLimit("login", 10, 60_000);
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) return { error: "invalid_credentials" };
    await createSession(user.id);
    await mergeGuestIntoUser(user.id);
  } catch (err) {
    return toActionError(err);
  }
  return { ok: true, meta: { next: safeNext(parsed.data.next) } };
}

export async function registerAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  const locale = await getLocale();
  try {
    await enforceRateLimit("register", 5, 60_000);
    const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) return { error: "email_taken", fieldErrors: { email: "email_taken" } };
    const role = await db.role.findUniqueOrThrow({ where: { key: "CUSTOMER" } });
    const user = await db.user.create({
      data: {
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName || null,
        phone: parsed.data.phone || null,
        locale: isLocale(locale) ? locale : "uk",
        roleId: role.id,
      },
    });
    await createSession(user.id);
    await mergeGuestIntoUser(user.id);
  } catch (err) {
    return toActionError(err);
  }
  return { ok: true, meta: { next: safeNext(parsed.data.next) } };
}

export async function logoutAction() {
  await destroySession();
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    await enforceRateLimit("forgot", 5, 10 * 60_000);
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    // Same response whether or not the account exists (no user enumeration).
    if (user) {
      const token = randomToken();
      await db.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60_000) },
      });
      const locale = await getLocale();
      const prefix = locale === "uk" ? "" : `/${locale}`;
      notify({ type: "password_reset", to: user.email, url: `${getAppUrl()}${prefix}/reset-password?token=${token}` });
    }
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    await enforceRateLimit("reset", 10, 10 * 60_000);
    const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) return { error: "invalid_token" };
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
      db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    await destroyAllSessions(record.userId);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    const user = await requireUser();
    await db.user.update({
      where: { id: user.id },
      data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName || null, phone: parsed.data.phone || null },
    });
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = changePasswordSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { error: "validation", fieldErrors: zodFieldErrors(parsed.error.issues) };
  try {
    await enforceRateLimit("change-password", 5, 60_000);
    const current = await requireUser();
    const user = await db.user.findUniqueOrThrow({ where: { id: current.id } });
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return { error: "wrong_password", fieldErrors: { currentPassword: "wrong_password" } };
    }
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
    // Invalidate other sessions, keep this device signed in.
    await destroyAllSessions(user.id);
    await createSession(user.id);
    return { ok: true };
  } catch (err) {
    return toActionError(err);
  }
}
