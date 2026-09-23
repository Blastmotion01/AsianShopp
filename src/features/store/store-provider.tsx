"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { CartView } from "@/features/cart/service";
import { formatPrice } from "@/lib/money";
import type { Locale } from "@/config/site";

type SessionUser = { firstName: string; email: string; isAdmin: boolean } | null;

type StoreContext = {
  ready: boolean;
  user: SessionUser;
  cart: CartView | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  pendingVariant: string | null;
  addToCart: (variantId: string, quantity?: number, opts?: { openDrawer?: boolean }) => Promise<boolean>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  applyPromo: (code: string) => Promise<boolean>;
  removePromo: () => Promise<void>;
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = React.createContext<StoreContext | null>(null);

export function useStore() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: string; meta?: Record<string, unknown> };

async function api<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "server_error" };
  }
}

/**
 * Client store for cart, wishlist and session. The server is the source of truth;
 * every mutation returns the fresh cart from /api/cart.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [ready, setReady] = React.useState(false);
  const [user, setUser] = React.useState<SessionUser>(null);
  const [cart, setCart] = React.useState<CartView | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [pendingVariant, setPendingVariant] = React.useState<string | null>(null);
  const [wishlist, setWishlist] = React.useState<Set<string>>(new Set());

  const showError = React.useCallback(
    (code: string, meta?: Record<string, unknown>) => {
      const key = t.has(`errors.${code}`) ? `errors.${code}` : "errors.generic";
      const values: Record<string, string | number> = {};
      if (meta?.minOrder) values.amount = formatPrice(Number(meta.minOrder), locale);
      if (meta?.available !== undefined) values.count = Number(meta.available);
      toast.error(t(key, values));
    },
    [t, locale],
  );

  const refresh = React.useCallback(async () => {
    const [c, w, s] = await Promise.all([
      api<{ cart: CartView }>(`/api/cart?locale=${locale}`),
      api<{ ids: string[] }>("/api/wishlist"),
      api<{ user: SessionUser }>("/api/session"),
    ]);
    if (c.ok) setCart(c.cart);
    if (w.ok) setWishlist(new Set(w.ids));
    if (s.ok) setUser(s.user);
    setReady(true);
  }, [locale]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial sync with the server
    void refresh();
  }, [refresh]);

  const addToCart = React.useCallback<StoreContext["addToCart"]>(
    async (variantId, quantity = 1, opts) => {
      setPendingVariant(variantId);
      const res = await api<{ cart: CartView }>(`/api/cart?locale=${locale}`, {
        method: "POST",
        body: JSON.stringify({ variantId, quantity }),
      });
      setPendingVariant(null);
      if (!res.ok) {
        showError(res.error, res.meta);
        return false;
      }
      setCart(res.cart);
      if (opts?.openDrawer ?? true) setCartOpen(true);
      else toast.success(t("product.added"));
      return true;
    },
    [locale, showError, t],
  );

  const setQuantity = React.useCallback<StoreContext["setQuantity"]>(
    async (variantId, quantity) => {
      // optimistic update
      setCart((prev) =>
        prev ? { ...prev, lines: prev.lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)) } : prev,
      );
      const res = await api<{ cart: CartView }>(`/api/cart?locale=${locale}`, {
        method: "PATCH",
        body: JSON.stringify({ variantId, quantity }),
      });
      if (res.ok) setCart(res.cart);
      else {
        showError(res.error, res.meta);
        void refresh();
      }
    },
    [locale, showError, refresh],
  );

  const applyPromo = React.useCallback(
    async (code: string) => {
      const res = await api<{ cart: CartView }>(`/api/cart/promo?locale=${locale}`, { method: "POST", body: JSON.stringify({ code }) });
      if (!res.ok) {
        showError(res.error, res.meta);
        return false;
      }
      setCart(res.cart);
      toast.success(t("cart.promoApplied", { code: code.toUpperCase() }));
      return true;
    },
    [locale, showError, t],
  );

  const removePromo = React.useCallback(async () => {
    const res = await api<{ cart: CartView }>(`/api/cart/promo?locale=${locale}`, { method: "DELETE" });
    if (res.ok) setCart(res.cart);
  }, [locale]);

  const toggleWishlist = React.useCallback(
    async (productId: string) => {
      const had = wishlist.has(productId);
      setWishlist((prev) => {
        const next = new Set(prev);
        if (had) next.delete(productId);
        else next.add(productId);
        return next;
      });
      const res = await api<{ ids: string[]; added: boolean }>("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
      if (!res.ok) {
        showError(res.error, res.meta);
        void refresh();
        return;
      }
      setWishlist(new Set(res.ids));
      toast.success(t(res.added ? "product.wishlistAdded" : "product.wishlistRemoved"));
    },
    [wishlist, showError, refresh, t],
  );

  const value = React.useMemo<StoreContext>(
    () => ({ ready, user, cart, cartOpen, setCartOpen, pendingVariant, addToCart, setQuantity, applyPromo, removePromo, wishlist, toggleWishlist, refresh }),
    [ready, user, cart, cartOpen, pendingVariant, addToCart, setQuantity, applyPromo, removePromo, wishlist, toggleWishlist, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
