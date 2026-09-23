import { ProductCard } from "@/features/products/components/product-card";
import type { ProductCardData } from "@/features/products/types";

/** Horizontal snap-scroll on mobile, grid on desktop. */
export function ProductRow({ products, columns = 4 }: { products: ProductCardData[]; columns?: 3 | 4 }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-none md:mx-0 md:overflow-visible md:px-0">
      <ul className={`flex snap-x snap-mandatory gap-4 md:grid md:gap-5 ${columns === 4 ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3"}`}>
        {products.map((p) => (
          <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-auto">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
