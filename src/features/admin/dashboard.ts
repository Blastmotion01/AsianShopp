import "server-only";
import { db } from "@/lib/db";
import { pickLocalized } from "@/lib/localized";
import type { Locale } from "@/config/site";
import { computeProfit } from "./profit";

const DAY = 864e5;

/** KPI + chart data for the last `days` days. Cancelled orders are excluded from revenue. */
export async function getDashboardData(locale: Locale, days = 30) {
  const since = new Date(Date.now() - days * DAY);
  since.setHours(0, 0, 0, 0);

  const [orders, productsCount, customersCount, lowStock, recentOrders, items] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true, subtotal: true, discount: true, items: { select: { total: true, quantity: true, unitCost: true } } },
    }),
    db.product.count({ where: { isActive: true } }),
    db.user.count({ where: { role: { key: "CUSTOMER" } } }),
    db.inventory.findMany({
      where: { quantity: { lte: 5 }, variant: { isActive: true, product: { isActive: true } } },
      orderBy: { quantity: "asc" },
      take: 8,
      include: { variant: { include: { product: { include: { translations: { where: { locale } } } } } } },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: since }, status: { not: "CANCELLED" } } },
      select: { total: true, product: { select: { category: { select: { name: true } }, country: { select: { name: true, code: true } } } } },
    }),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const profit = computeProfit(orders);
  const lowStockCount = await db.inventory.count({ where: { quantity: { lte: 5 }, variant: { isActive: true, product: { isActive: true } } } });

  // Daily series (every day present, zero-filled)
  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(since.getTime() + i * DAY);
    byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const b = byDay.get(key);
    if (b) {
      b.revenue += o.total;
      b.orders += 1;
    }
  }
  const daily = [...byDay.entries()].map(([date, v]) => ({ date, revenue: Math.round(v.revenue / 100), orders: v.orders }));

  const group = (key: (i: (typeof items)[number]) => string) => {
    const m = new Map<string, number>();
    for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + it.total);
    return [...m.entries()].map(([name, value]) => ({ name, value: Math.round(value / 100) })).sort((a, b) => b.value - a.value);
  };

  return {
    kpi: {
      revenue,
      orders: orders.length,
      avgOrder: orders.length ? Math.round(revenue / orders.length) : 0,
      products: productsCount,
      customers: customersCount,
      lowStock: lowStockCount,
      profit: profit.profit,
      margin: profit.margin,
      itemsWithoutCost: profit.itemsWithoutCost,
    },
    daily,
    byCategory: group((i) => (i.product ? pickLocalized(i.product.category.name, locale) : "—")),
    byCountry: group((i) => (i.product?.country ? pickLocalized(i.product.country.name, locale) : "Mix")),
    lowStock: lowStock.map((inv) => ({
      id: inv.id,
      productId: inv.variant.productId,
      name: inv.variant.product.translations[0]?.name ?? inv.variant.product.slug,
      sku: inv.variant.sku,
      quantity: inv.quantity,
    })),
    recentOrders,
  };
}
