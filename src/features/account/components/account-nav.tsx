"use client";

import { useTranslations } from "next-intl";
import { User, Package, Heart, MapPin, LogOut } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const t = useTranslations("account");
  const tn = useTranslations("nav");
  const pathname = usePathname();
  const items = [
    { href: "/account", label: t("profile"), icon: User, exact: true },
    { href: "/account/orders", label: t("orders"), icon: Package },
    { href: "/wishlist", label: t("wishlist"), icon: Heart },
    { href: "/account/addresses", label: t("addresses"), icon: MapPin },
  ];
  return (
    <nav aria-label={t("title")} className="-mx-4 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:px-0">
      <ul className="flex gap-2 lg:flex-col">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full border-2 px-4 py-2.5 font-semibold whitespace-nowrap transition-colors lg:rounded-xl",
                  active ? "border-ink bg-ink text-white" : "border-transparent hover:bg-cream-100",
                )}
              >
                <it.icon className="size-4" aria-hidden="true" /> {it.label}
              </Link>
            </li>
          );
        })}
        <li>
          <LogoutButton className="flex items-center gap-3 rounded-full border-2 border-transparent px-4 py-2.5 font-semibold whitespace-nowrap text-muted hover:bg-cream-100 lg:rounded-xl">
            <LogOut className="size-4" aria-hidden="true" /> {tn("logout")}
          </LogoutButton>
        </li>
      </ul>
    </nav>
  );
}
