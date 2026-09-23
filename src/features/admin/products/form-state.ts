/** Shared (server + client) editor state for the admin product form. */
type Locale3 = "uk" | "ru" | "en";
type VariantState = { id?: string; sku: string; nameUk: string; nameRu: string; nameEn: string; price: string; compareAtPrice: string; weightGrams: string; stock: string };
export type ProductFormState = {
  id?: string;
  slug: string;
  translations: Record<Locale3, { name: string; shortDescription: string; description: string; ingredients: string; allergens: string }>;
  categoryId: string;
  countryId: string;
  brandName: string;
  volumeMl: string;
  spiceLevel: number;
  tags: string;
  isNew: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  isLimited: boolean;
  isActive: boolean;
  images: { url: string; alt: string }[];
  variants: VariantState[];
  nutrition: Record<"energyKcal" | "fat" | "carbs" | "sugar" | "protein" | "salt", string>;
  seoTitle: Record<Locale3, string>;
  seoDescription: Record<Locale3, string>;
};

const emptyTr = { name: "", shortDescription: "", description: "", ingredients: "", allergens: "" };
export const EMPTY_PRODUCT: ProductFormState = {
  slug: "",
  translations: { uk: { ...emptyTr }, ru: { ...emptyTr }, en: { ...emptyTr } },
  categoryId: "",
  countryId: "",
  brandName: "",
  volumeMl: "",
  spiceLevel: 0,
  tags: "",
  isNew: true,
  isPopular: false,
  isFeatured: false,
  isLimited: false,
  isActive: true,
  images: [],
  variants: [{ sku: "", nameUk: "1 шт", nameRu: "1 шт", nameEn: "Single", price: "", compareAtPrice: "", weightGrams: "", stock: "0" }],
  nutrition: { energyKcal: "", fat: "", carbs: "", sugar: "", protein: "", salt: "" },
  seoTitle: { uk: "", ru: "", en: "" },
  seoDescription: { uk: "", ru: "", en: "" },
};
