"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Dialog as D } from "radix-ui";
import { LayoutDashboard, Package, Warehouse, ShoppingCart, Users, TicketPercent, LayoutTemplate, ScrollText, ArrowLeft, Menu } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { SheetContent } from "@/components/ui/dialog";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard, perm: "dashboard:read", exact: true },
  { href: "/admin/products", key: "products", icon: Package, perm: "products:write" },
  { href: "/admin/inventory", key: "inventory", icon: Warehouse, perm: "inventory:write" },
  { href: "/admin/orders", key: "orders", icon: ShoppingCart, perm: "orders:read" },
  { href: "/admin/customers", key: "customers", icon: Users, perm: "customers:read" },
  { href: "/admin/promocodes", key: "promocodes", icon: TicketPercent, perm: "promocodes:write" },
  { href: "/admin/cms", key: "cms", icon: LayoutTemplate, perm: "cms:write" },
  { href: "/admin/logs", key: "logs", icon: ScrollText, perm: "logs:read" },
] as const;

export function AdminShell({ user, children }: { user: { name: string; email: string; permissions: string[] }; children: React.ReactNode }) {
  const t = useTranslations("admin.nav");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const can = (perm: string) => user.permissions.includes("*") || user.permissions.includes(perm);
  const items = NAV.filter((n) => can(n.perm));

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {items.map((n) => {
        const active = "exact" in n && n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-coral-500 text-ink" : "text-cream-100/80 hover:bg-cream-100/10 hover:text-white",
            )}
          >
            <n.icon className="size-4" aria-hidden="true" /> {t(n.key)}
          </Link>
        );
      })}
      <Link href="/" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-cream-100/60 hover:text-white">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("backToShop")}
      </Link>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#F4EFEA] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-ink p-4 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3 px-2 pt-2">
          <Logo variant="compact" />
          <span className="font-display text-sm font-bold text-white">Admin</span>
        </Link>
        {nav}
        <div className="mt-auto rounded-xl bg-cream-100/5 p-3 text-xs text-cream-100/70">
          <p className="font-bold text-white">{user.name}</p>
          <p className="truncate">{user.email}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-2 border-line bg-white/90 px-4 backdrop-blur lg:px-8">
          <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-ink/5 lg:hidden" onClick={() => setOpen(true)} aria-label={tn("menu")}>
            <Menu className="size-5" />
          </button>
          <span className="font-display text-sm font-bold lg:hidden">AsiaShop Admin</span>
          <div className="ml-auto">
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main" className="p-4 md:p-8">
          {children}
        </main>
      </div>

      <D.Root open={open} onOpenChange={setOpen}>
        <SheetContent side="left" closeLabel={tc("close")} className="bg-ink" aria-describedby={undefined}>
          <D.Title className="sr-only">Admin</D.Title>
          <div className="p-4 pt-6">
            <div className="mb-6 px-2">
              <Logo onDark />
            </div>
            {nav}
          </div>
        </SheetContent>
      </D.Root>
    </div>
  );
}
