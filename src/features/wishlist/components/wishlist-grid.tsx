"use client";

import { AnimatePresence, motion } from "motion/react";
import { ProductCard } from "@/features/products/components/product-card";
import { useStore } from "@/features/store/store-provider";
import type { ProductCardData } from "@/features/products/types";

/** Removes cards live when the heart is toggled off (store is the source of truth once loaded). */
export function WishlistGrid({ products, empty }: { products: ProductCardData[]; empty: React.ReactNode }) {
  const { wishlist, ready } = useStore();
  const visible = ready ? products.filter((p) => wishlist.has(p.id)) : products;
  if (ready && visible.length === 0) return <>{empty}</>;
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      <AnimatePresence initial={false}>
        {visible.map((p) => (
          <motion.li key={p.id} layout exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}>
            <ProductCard product={p} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
