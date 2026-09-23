import "server-only";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { AuthError, ForbiddenError } from "@/lib/errors";
import { getCurrentUser, type CurrentUser } from "./session";
import { hasPermission, type Permission } from "./permissions";

/** For pages: redirects to /login when signed out. */
export async function requireUserPage(nextPath: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: `/login?next=${encodeURIComponent(nextPath)}`, locale });
  }
  return user;
}

/** For admin pages: signed-out → login, lacking permission → 404 (don't reveal admin). */
export async function requireAdminPage(perm: Permission = "admin:access"): Promise<CurrentUser> {
  const user = await requireUserPage("/admin");
  if (!hasPermission(user.permissions, "admin:access") || !hasPermission(user.permissions, perm)) notFound();
  return user;
}

/** For server actions / route handlers: throws typed errors. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export async function requirePermission(perm: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user.permissions, "admin:access") || !hasPermission(user.permissions, perm)) {
    throw new ForbiddenError();
  }
  return user;
}
