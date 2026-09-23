"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/utils";

export function Gallery({ images, name, bgClass, isPlaceholder }: { images: { url: string; alt: string }[]; name: string; bgClass: string; isPlaceholder: boolean }) {
  const t = useTranslations("product");
  const [active, setActive] = React.useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <figure className="flex-1">
        <div className={cn("relative aspect-square overflow-hidden rounded-2xl border-2 border-ink", bgClass)}>
          {current && (
            <ProductImage key={current.url} src={current.url} alt={current.alt || name} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          )}
        </div>
        {isPlaceholder && <figcaption className="mt-2 text-center text-xs font-semibold text-muted">{t("imagePlaceholderNote")}</figcaption>}
      </figure>
      {images.length > 1 && (
        <ul className="flex gap-2 md:flex-col" aria-label={name}>
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={t("galleryImage", { index: i + 1 })}
                aria-current={i === active}
                className={cn("relative block size-16 overflow-hidden rounded-lg border-2 md:size-20", i === active ? "border-ink" : "border-line opacity-70 hover:opacity-100")}
              >
                <ProductImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
