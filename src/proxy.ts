import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { COOKIE } from "@/config/site";

const intl = createMiddleware(routing);

const PROTECTED = /^\/(?:(?:ru|en)\/)?(?:admin|account)(?:\/|$)/;

/**
 * Locale routing + optimistic auth redirect.
 * This only checks cookie presence; real authorization happens server-side
 * in layouts (requireAdminPage) and in every server action (requirePermission).
 */
export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PROTECTED.test(pathname) && !req.cookies.get(COOKIE.session)) {
    const prefix = pathname.match(/^\/(ru|en)(?=\/|$)/)?.[0] ?? "";
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    url.search = `?next=${encodeURIComponent(pathname.replace(/^\/(ru|en)/, "") + search)}`;
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|uploads|.*\\..*).*)"],
};
