export type BadgeKind = "NEW" | "BESTSELLER" | "LIMITED" | "HOT" | "SALE";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  brand: string | null;
  country: { code: string; name: string; flag: string } | null;
  category: { slug: string; name: string };
  price: number;
  compareAtPrice: number | null;
  image: { url: string; alt: string } | null;
  badges: BadgeKind[];
  weightGrams: number | null;
  volumeMl: number | null;
  spiceLevel: number;
  rating: number;
  reviewCount: number;
  stock: number;
  defaultVariantId: string | null;
  variantCount: number;
};

export type ProductVariantView = {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  weightGrams: number | null;
  stock: number;
};

export type ProductDetail = ProductCardData & {
  description: string;
  ingredients: string | null;
  allergens: string | null;
  nutrition: Record<string, number> | null;
  images: { url: string; alt: string }[];
  variants: ProductVariantView[];
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string;
  countryId: string | null;
  tags: string[];
  updatedAt: Date;
};
