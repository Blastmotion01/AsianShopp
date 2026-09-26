import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { COOKIE } from "@/config/site";

const intl = createMiddleware(routing);

const PROTECTED = /^\/(?:en\/)?(?:admin|account)(?:\/|$)/;
/** The Russian version was removed — old /ru links (bookmarks, search engines) go to the Ukrainian page. */
const REMOVED_LOCALE = /^\/ru(?=\/|$)/;

/**
 * Locale routing + optimistic auth redirect.
 * This only checks cookie presence; real authorization happens server-side
 * in layouts (requireAdminPage) and in every server action (requirePermission).
 */
export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (REMOVED_LOCALE.test(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(REMOVED_LOCALE, "") || "/";
    return NextResponse.redirect(url, 308);
  }
  if (PROTECTED.test(pathname) && !req.cookies.get(COOKIE.session)) {
    const prefix = pathname.match(/^\/en(?=\/|$)/)?.[0] ?? "";
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    url.search = `?next=${encodeURIComponent(pathname.replace(/^\/en/, "") + search)}`;
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|uploads|.*\\..*).*)"],
};
