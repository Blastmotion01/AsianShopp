import { z } from "zod";

/**
 * CMS block definitions. Each homepage block is a ContentBlock row whose `data`
 * matches one of these schemas. Admins edit text, visibility and order in /admin/cms.
 * No imports of server-only code here: the seed script uses this file too.
 */
const L = z.object({
  uk: z.string().trim().max(400).default(""),
  ru: z.string().trim().max(400).default(""),
  en: z.string().trim().max(400).default(""),
});
export type LText = z.infer<typeof L>;

const href = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v.startsWith("/") && !v.startsWith("//"), "Must be an internal path starting with /");

export const blockSchemas = {
  hero: z.object({
    eyebrow: L,
    title: L,
    highlight: L,
    subtitle: L,
    ctaLabel: L,
    ctaHref: href,
    secondaryLabel: L,
    secondaryHref: href,
  }),
  section: z.object({ title: L, subtitle: L }),
  banner: z.object({ title: L, text: L, code: z.string().trim().max(40).default(""), ctaLabel: L, ctaHref: href }),
  announcement: z.object({ text: L, href: z.union([href, z.literal("")]).default("") }),
} as const;

export type BlockType = keyof typeof blockSchemas;
export type HeroData = z.infer<typeof blockSchemas.hero>;
export type SectionData = z.infer<typeof blockSchemas.section>;
export type BannerData = z.infer<typeof blockSchemas.banner>;
export type AnnouncementData = z.infer<typeof blockSchemas.announcement>;

/** Homepage block keys in default order. `type` decides which editor/schema is used. */
export const HOME_BLOCKS: { key: string; type: BlockType }[] = [
  { key: "announcement", type: "announcement" },
  { key: "hero", type: "hero" },
  { key: "countries", type: "section" },
  { key: "featured", type: "section" },
  { key: "categories", type: "section" },
  { key: "snackMatch", type: "section" },
  { key: "newArrivals", type: "section" },
  { key: "mysteryBox", type: "section" },
  { key: "promoBanner", type: "banner" },
  { key: "spicy", type: "section" },
  { key: "benefits", type: "section" },
];

const t = (uk: string, ru: string, en: string) => ({ uk, ru, en });

export const DEFAULT_BLOCK_DATA: Record<string, unknown> = {
  announcement: {
    text: t(
      "Безкоштовна доставка від 1000 ₴ · Самовивіз у Дніпрі",
      "Бесплатная доставка от 1000 ₴ · Самовывоз в Днепре",
      "Free delivery from 1000 ₴ · Pickup in Dnipro",
    ),
    href: "/products",
  },
  hero: {
    eyebrow: t("Корея · Японія · Китай · США", "Корея · Япония · Китай · США", "Korea · Japan · China · USA"),
    title: t("Весь світ", "Весь мир", "The whole world"),
    highlight: t("на смак", "на вкус", "by taste"),
    subtitle: t(
      "Солодощі, напої та снеки, яких немає в супермаркеті. Привозимо з Кореї, Японії, Китаю та США — доставляємо по всій Україні.",
      "Сладости, напитки и снеки, которых нет в супермаркете. Привозим из Кореи, Японии, Китая и США — доставляем по всей Украине.",
      "Sweets, drinks and snacks you won’t find in the supermarket. Imported from Korea, Japan, China and the USA — delivered across Ukraine.",
    ),
    ctaLabel: t("Досліджувати смаколики", "Исследовать вкусняшки", "Explore the snacks"),
    ctaHref: "/products",
    secondaryLabel: t("Пройти Snack Match", "Пройти Snack Match", "Take the Snack Match"),
    secondaryHref: "/snack-match",
  },
  countries: {
    title: t("Обери країну", "Выбери страну", "Choose your country"),
    subtitle: t("Кожна країна — свій характер смаку", "Каждая страна — свой характер вкуса", "Every country has its own flavour personality"),
  },
  featured: {
    title: t("Хіти, які варто спробувати", "Хиты, которые стоит попробовать", "Hits worth trying"),
    subtitle: t("Переверни картку, щоб дізнатися більше", "Переверни карточку, чтобы узнать больше", "Flip a card to learn more"),
  },
  categories: {
    title: t("Що будемо куштувати?", "Что будем пробовать?", "What are we tasting?"),
    subtitle: t("", "", ""),
  },
  snackMatch: {
    title: t("Не знаєш, що обрати?", "Не знаешь, что выбрать?", "Not sure what to pick?"),
    subtitle: t(
      "5 питань — і Snack Match підбере смаколики саме під тебе",
      "5 вопросов — и Snack Match подберёт вкусняшки именно под тебя",
      "5 questions and Snack Match finds your perfect snacks",
    ),
  },
  newArrivals: {
    title: t("Щойно приїхало", "Только приехало", "Just landed"),
    subtitle: t("Свіжі новинки з останньої поставки", "Свежие новинки из последней поставки", "Fresh arrivals from the latest shipment"),
  },
  mysteryBox: {
    title: t("Mystery Box", "Mystery Box", "Mystery Box"),
    subtitle: t(
      "Довірся нам: коробка-сюрприз, вміст якої завжди дорожчий за ціну",
      "Доверься нам: коробка-сюрприз, содержимое которой всегда дороже цены",
      "Trust us: a surprise box whose contents always cost more than the price",
    ),
  },
  promoBanner: {
    title: t("−10% на перше замовлення", "−10% на первый заказ", "−10% on your first order"),
    text: t("Використай промокод при оформленні від 300 ₴", "Используй промокод при оформлении от 300 ₴", "Use the code at checkout on orders from 300 ₴"),
    code: "WELCOME10",
    ctaLabel: t("До каталогу", "В каталог", "Shop now"),
    ctaHref: "/products",
  },
  spicy: {
    title: t("Зона вогню 🔥", "Зона огня 🔥", "Fire zone 🔥"),
    subtitle: t("Від легкого пощипування до сліз щастя", "От лёгкого покалывания до слёз счастья", "From a gentle tingle to happy tears"),
  },
  benefits: {
    title: t("Чому AsiaShop", "Почему AsiaShop", "Why AsiaShop"),
    subtitle: t("", "", ""),
  },
};

export const DEFAULT_SETTINGS = {
  freeShippingEnabled: true,
  /** minor units */
  freeShippingThreshold: 100000,
};
export type StoreSettings = typeof DEFAULT_SETTINGS;
