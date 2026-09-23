import { ProductCardSkeleton } from "@/features/products/components/product-card";
import { Skeleton } from "@/components/ui/misc";

export default function CatalogLoading() {
  return (
    <div className="container-page pt-6 pb-10 md:pt-10" aria-busy="true">
      <Skeleton className="mb-8 h-14 w-64" />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-xl lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
