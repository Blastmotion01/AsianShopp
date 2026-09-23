export const locales = ["uk", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "uk";

export const siteConfig = {
  name: "AsiaShop",
  city: "Дніпро",
  country: "UA",
  currency: "UAH",
  currencySymbol: "₴",
  email: "hello@asiashop.ua",
  phone: "+380 00 000 00 00",
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/",
  telegram: "https://t.me/",
} as const;

export const intlLocale: Record<Locale, string> = {
  uk: "uk-UA",
  ru: "ru-UA",
  en: "en-US",
};

/** Cookie names — kept in one place so proxy and server code agree. */
export const COOKIE = {
  session: "as_session",
  guest: "as_guest",
} as const;

export const PAGE_SIZE = 12;
export const MAX_CART_QTY = 50;
