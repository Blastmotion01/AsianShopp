"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { DropdownMenu, Dialog as D } from "radix-ui";
import { Heart, Menu, Search, ShoppingBag, User, ChevronDown, LogOut, LayoutDashboard, Package } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { Flag } from "@/components/brand/flag";
import { SheetContent } from "@/components/ui/dialog";
import { useStore } from "@/features/store/store-provider";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";
import { LanguagePills, LanguageSwitcher } from "./language-switcher";
import { SearchDialog } from "./search-dialog";

export type HeaderCountry = { code: string; name: string; flag: string };

export function Header({
  announcement,
  countries,
  popularSearches,
}: {
  announcement: { text: string; href: string } | null;
  countries: HeaderCountry[];
  popularSearches: string[];
}) {
  const t = useTranslations("nav");
  const th = useTranslations("header");
  const { cart, setCartOpen, wishlist, user } = useStore();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const count = cart?.count ?? 0;
  const links = [
    { href: "/products", label: t("catalog") },
    { href: "/products?new=1", label: t("new") },
    { href: "/products?category=spicy", label: t("spicy") },
    { href: "/snack-match", label: t("snackMatch") },
    { href: "/mystery-box", label: t("mysteryBox") },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {th("skipToContent")}
      </a>

      {announcement?.text && (
        <div className="bg-ink text-center text-[0.8rem] font-semibold text-cream-200">
          <div className="container-page py-2">
            {announcement.href ? (
              <Link href={announcement.href} className="hover:underline">
                {announcement.text}
              </Link>
            ) : (
              announcement.text
            )}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 px-2 pt-2 md:px-4">
        <div
          className={cn(
            "mx-auto flex h-16 max-w-[1320px] items-center gap-2 rounded-full border-2 px-3 transition-all duration-300 md:h-[4.25rem] md:px-5",
            scrolled ? "border-ink bg-white/90 shadow-soft backdrop-blur-md" : "border-transparent bg-transparent",
          )}
        >
          {/* Mobile: hamburger */}
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full hover:bg-ink/5 xl:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label={th("openMenu")}
          >
            <Menu className="size-6" />
          </button>

          <Link href="/" aria-label={th("homeLink")} className="shrink-0 rounded-lg px-1 py-1">
            <Logo />
          </Link>

          <nav aria-label={t("menu")} className="ml-4 hidden items-center gap-0.5 xl:flex">
            <Link
              href={links[0].href}
              className={cn("rounded-full px-3.5 py-2 text-[0.95rem] font-semibold hover:bg-ink/5", pathname === "/products" && "bg-ink/5")}
            >
              {links[0].label}
            </Link>
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.95rem] font-semibold hover:bg-ink/5">
                {t("countries")} <ChevronDown className="size-4" aria-hidden="true" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content sideOffset={10} className="z-50 grid min-w-56 gap-1 rounded-xl border-2 border-ink bg-white p-2 shadow-pop">
                  {countries.map((c) => (
                    <DropdownMenu.Item key={c.code} asChild>
                      <Link
                        href={`/products?country=${c.code}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold outline-none data-[highlighted]:bg-cream-100"
                      >
                        <Flag code={c.code} className="text-2xl" />
                        {c.name}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
            {links.slice(1).map((l) => (
              <Link key={l.href} href={l.href} className="rounded-full px-3.5 py-2 text-[0.95rem] font-semibold whitespace-nowrap hover:bg-ink/5">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={th("openSearch")}
              className="hidden h-10 items-center gap-2 rounded-full border-2 border-ink/10 bg-white px-4 text-sm text-muted transition-colors hover:border-ink 2xl:inline-flex"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="w-28 text-left">{t("catalog")}…</span>
              <kbd className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[0.7rem] font-bold">Ctrl K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={th("openSearch")}
              className="grid size-10 place-items-center rounded-full hover:bg-ink/5 2xl:hidden"
            >
              <Search className="size-5" />
            </button>

            <LanguageSwitcher className="hidden md:inline-flex" />

            <Link
              href="/wishlist"
              aria-label={`${t("wishlist")} (${wishlist.size})`}
              className="relative hidden size-10 place-items-center rounded-full hover:bg-ink/5 md:grid"
            >
              <Heart className="size-5" />
              {wishlist.size > 0 && <CountBubble value={wishlist.size} tone="pink" />}
            </Link>

            {user ? (
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger
                  className="hidden h-10 items-center gap-2 rounded-full px-2 hover:bg-ink/5 md:inline-flex"
                  aria-label={t("account")}
                >
                  <span className="grid size-8 place-items-center rounded-full bg-pink-300 font-display text-sm font-bold">
                    {user.firstName.slice(0, 1).toUpperCase()}
                  </span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content align="end" sideOffset={10} className="z-50 min-w-52 rounded-xl border-2 border-ink bg-white p-1.5 shadow-pop">
                    <div className="px-3 py-2 text-sm">
                      <p className="font-bold">{user.firstName}</p>
                      <p className="truncate text-muted">{user.email}</p>
                    </div>
                    <DropdownMenu.Separator className="my-1 h-0.5 bg-line" />
                    <MenuLink href="/account" icon={<User className="size-4" />}>
                      {t("account")}
                    </MenuLink>
                    <MenuLink href="/account/orders" icon={<Package className="size-4" />}>
                      {t("orders")}
                    </MenuLink>
                    {user.isAdmin && (
                      <MenuLink href="/admin" icon={<LayoutDashboard className="size-4" />}>
                        {t("admin")}
                      </MenuLink>
                    )}
                    <DropdownMenu.Separator className="my-1 h-0.5 bg-line" />
                    <DropdownMenu.Item asChild>
                      <LogoutButton className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none data-[highlighted]:bg-cream-100">
                        <LogOut className="size-4" /> {t("logout")}
                      </LogoutButton>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <Link href="/login" aria-label={t("login")} className="hidden size-10 place-items-center rounded-full hover:bg-ink/5 md:grid">
                <User className="size-5" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`${th("openCart")} (${count})`}
              className="relative ml-1 inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-coral-500 px-3.5 font-bold text-ink shadow-pop-sm transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <ShoppingBag className="size-5" aria-hidden="true" />
              <span className="min-w-4 text-center tabular-nums">{count}</span>
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} popular={popularSearches} />

      <D.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" closeLabel={th("closeMenu")} aria-describedby={undefined}>
          <D.Title className="sr-only">{t("menu")}</D.Title>
          <div className="flex h-full flex-col overflow-y-auto p-5">
            <Link href="/" onClick={() => setMenuOpen(false)} className="mb-8 self-start">
              <Logo />
            </Link>
            <nav aria-label={t("menu")} className="grid gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 font-display text-lg font-bold hover:bg-cream-100"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/products?country=${c.code}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border-2 border-ink/10 bg-white px-3 py-3 font-semibold"
                >
                  <Flag code={c.code} className="text-xl" />
                  {c.name}
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-1 border-t-2 border-line pt-6">
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-cream-100">
                <Heart className="size-5" /> {t("wishlist")} {wishlist.size > 0 && <span className="text-muted">({wishlist.size})</span>}
              </Link>
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-cream-100"
              >
                <User className="size-5" /> {user ? t("account") : t("login")}
              </Link>
              {user?.isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-cream-100">
                  <LayoutDashboard className="size-5" /> {t("admin")}
                </Link>
              )}
              {user && (
                <LogoutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-cream-100">
                  <LogOut className="size-5" /> {t("logout")}
                </LogoutButton>
              )}
            </div>
            <div className="mt-auto pt-6">
              <p className="mb-2 text-xs font-bold tracking-wider text-muted uppercase">{t("language")}</p>
              <LanguagePills />
            </div>
          </div>
        </SheetContent>
      </D.Root>
    </>
  );
}

function CountBubble({ value, tone }: { value: number; tone: "pink" | "coral" }) {
  return (
    <span
      className={cn(
        "absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white px-1 text-[0.65rem] font-bold text-ink",
        tone === "pink" ? "bg-pink-300" : "bg-coral-500",
      )}
      aria-hidden="true"
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-none data-[highlighted]:bg-cream-100">
        {icon}
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
