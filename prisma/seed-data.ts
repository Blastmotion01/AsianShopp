/* Demo catalog for AsiaShop. Prices are in UAH (converted to kopiykas by the seed). */

type L = { uk: string; ru: string; en: string };

export type SeedCountry = { code: string; slug: string; flag: string; accentColor: string; name: L; tagline: L };
export type SeedCategory = { slug: string; emoji: string; color: string; name: L; description: L; showOnHome?: boolean };

export type SeedVariant = { suffix: string; name: L; price: number; compareAt?: number; weight?: number; stock: number };

export type SeedProduct = {
  slug: string;
  country: string | null;
  category: string;
  brand: string;
  price: number;
  compareAt?: number;
  weight?: number;
  volume?: number;
  spice?: number;
  tags: string[];
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
  isLimited?: boolean;
  stock: number;
  name: L;
  short: L;
  desc: L;
  ingredients?: L;
  allergens?: L;
  nutrition?: { energyKcal: number; fat: number; carbs: number; sugar: number; protein: number; salt: number };
  variants?: SeedVariant[];
};

export const countries: SeedCountry[] = [
  { code: "KR", slug: "korea", flag: "🇰🇷", accentColor: "#FF9DB1",
    name: { uk: "Корея", ru: "Корея", en: "Korea" },
    tagline: { uk: "Рамен, мілкіс і банановий шок", ru: "Рамен, милкис и банановый шок", en: "Ramyun, Milkis & banana milk" } },
  { code: "JP", slug: "japan", flag: "🇯🇵", accentColor: "#FFE3C2",
    name: { uk: "Японія", ru: "Япония", en: "Japan" },
    tagline: { uk: "Матча, рамуне і кавайні снеки", ru: "Матча, рамунэ и кавайные снеки", en: "Matcha, Ramune & kawaii snacks" } },
  { code: "CN", slug: "china", flag: "🇨🇳", accentColor: "#F0573A",
    name: { uk: "Китай", ru: "Китай", en: "China" },
    tagline: { uk: "Латяо, White Rabbit і гострий чилі", ru: "Латяо, White Rabbit и острый чили", en: "Latiao, White Rabbit & chili crisp" } },
  { code: "US", slug: "usa", flag: "🇺🇸", accentColor: "#2A1F24",
    name: { uk: "США", ru: "США", en: "USA" },
    tagline: { uk: "Такіс, Reese’s і культові газовані", ru: "Такис, Reese’s и культовые газировки", en: "Takis, Reese’s & cult sodas" } },
];

export const categories: SeedCategory[] = [
  { slug: "candy", emoji: "🍬", color: "#FF9DB1", name: { uk: "Солодощі", ru: "Сладости", en: "Sweets" },
    description: { uk: "Цукерки та льодяники з усього світу", ru: "Конфеты и леденцы со всего мира", en: "Candies from around the world" } },
  { slug: "gummies", emoji: "🍭", color: "#FFB8C6", name: { uk: "Жувальні цукерки", ru: "Жевательные конфеты", en: "Chewy candy" },
    description: { uk: "Тягучі, фруктові, яскраві", ru: "Тягучие, фруктовые, яркие", en: "Chewy, fruity, bright" } },
  { slug: "chocolate", emoji: "🍫", color: "#8A5A44", name: { uk: "Шоколад", ru: "Шоколад", en: "Chocolate" },
    description: { uk: "Батончики, грибочки та матча-кіткати", ru: "Батончики, грибочки и матча-киткаты", en: "Bars, mushrooms and matcha KitKats" } },
  { slug: "cookies", emoji: "🍪", color: "#FFE3C2", name: { uk: "Печиво", ru: "Печенье", en: "Cookies" },
    description: { uk: "Покі, пепперо, чокопаї", ru: "Поки, пепперо, чокопаи", en: "Pocky, Pepero, Choco Pie" } },
  { slug: "drinks", emoji: "🥤", color: "#9EDCF0", name: { uk: "Напої", ru: "Напитки", en: "Drinks" },
    description: { uk: "Рамуне, мілкіс, бананове молоко", ru: "Рамунэ, милкис, банановое молоко", en: "Ramune, Milkis, banana milk" } },
  { slug: "snacks", emoji: "🍿", color: "#FFD27A", name: { uk: "Снеки", ru: "Снеки", en: "Snacks" },
    description: { uk: "Чипси, крекери, хрусткі палички", ru: "Чипсы, крекеры, хрустящие палочки", en: "Chips, crackers and crunchy sticks" } },
  { slug: "noodles", emoji: "🍜", color: "#F7B267", name: { uk: "Локшина", ru: "Лапша", en: "Noodles" },
    description: { uk: "Рамени та локшина швидкого приготування", ru: "Рамены и лапша быстрого приготовления", en: "Ramyun and instant noodles" } },
  { slug: "spicy", emoji: "🌶️", color: "#F0573A", name: { uk: "Гостре", ru: "Острое", en: "Spicy" },
    description: { uk: "Для тих, хто не боїться вогню", ru: "Для тех, кто не боится огня", en: "For the fearless" } },
  { slug: "mystery-box", emoji: "🎁", color: "#2A1F24", name: { uk: "Mystery Box", ru: "Mystery Box", en: "Mystery Box" },
    description: { uk: "Коробки-сюрпризи з добіркою смаків", ru: "Коробки-сюрпризы с подборкой вкусов", en: "Surprise boxes of curated flavours" }, showOnHome: false },
];

const n = (energyKcal: number, fat: number, carbs: number, sugar: number, protein: number, salt: number) => ({
  energyKcal, fat, carbs, sugar, protein, salt,
});

export const products: SeedProduct[] = [
  // ─── KOREA (8) ─────────────────────────────────────────────
  {
    slug: "nongshim-shin-ramyun", country: "KR", category: "noodles", brand: "Nongshim", price: 69, weight: 120, spice: 3,
    tags: ["spicy", "salty", "classic", "hot-meal"], isPopular: true, isFeatured: true, stock: 120,
    name: { uk: "Nongshim Shin Ramyun", ru: "Nongshim Shin Ramyun", en: "Nongshim Shin Ramyun" },
    short: { uk: "Легендарний гострий корейський рамен з яловичим бульйоном", ru: "Легендарный острый корейский рамен с говяжьим бульоном", en: "The legendary spicy Korean ramyun with beef broth" },
    desc: { uk: "Шин Рамьон — найпопулярніша локшина Кореї. Насичений яловичий бульйон, пружна локшина і приємна гострота, що зігріває. Готується за 4 хвилини.", ru: "Шин Рамён — самая популярная лапша Кореи. Насыщенный говяжий бульон, упругая лапша и приятная острота. Готовится за 4 минуты.", en: "Shin Ramyun is Korea’s best-selling noodle. Rich beef broth, springy noodles and a warming kick. Ready in 4 minutes." },
    ingredients: { uk: "Пшеничне борошно, пальмова олія, крохмаль, сіль, спеції, перець чилі, сушені овочі, яловичий екстракт", ru: "Пшеничная мука, пальмовое масло, крахмал, соль, специи, перец чили, сушёные овощи, говяжий экстракт", en: "Wheat flour, palm oil, starch, salt, spices, chili pepper, dried vegetables, beef extract" },
    allergens: { uk: "Пшениця, соя, яловичина", ru: "Пшеница, соя, говядина", en: "Wheat, soy, beef" },
    nutrition: n(450, 16, 67, 4, 10, 3.8),
    variants: [
      { suffix: "1", name: { uk: "1 шт", ru: "1 шт", en: "Single" }, price: 69, weight: 120, stock: 120 },
      { suffix: "5", name: { uk: "5 шт", ru: "5 шт", en: "5-pack" }, price: 319, compareAt: 345, weight: 600, stock: 30 },
    ],
  },
  {
    slug: "samyang-buldak-hot-chicken-ramen", country: "KR", category: "spicy", brand: "Samyang", price: 99, weight: 140, spice: 5,
    tags: ["spicy", "extreme", "unusual", "hot-meal"], isPopular: true, isFeatured: true, stock: 80,
    name: { uk: "Samyang Buldak Hot Chicken", ru: "Samyang Buldak Hot Chicken", en: "Samyang Buldak Hot Chicken" },
    short: { uk: "Той самий «вогняний курчак» з TikTok-челенджів", ru: "Тот самый «огненный цыплёнок» из TikTok-челленджей", en: "The fire-chicken noodles from every TikTok challenge" },
    desc: { uk: "Смажена локшина з пекучим курячим соусом. Для справжніх любителів гострого — починайте з половини соусу.", ru: "Жареная лапша с жгучим куриным соусом. Для настоящих любителей острого — начинайте с половины соуса.", en: "Stir-fried noodles in a blazing chicken sauce. For real heat lovers — start with half the sauce." },
    ingredients: { uk: "Пшеничне борошно, пальмова олія, соус (курячий екстракт, перець чилі, соєвий соус, цукор)", ru: "Пшеничная мука, пальмовое масло, соус (куриный экстракт, перец чили, соевый соус, сахар)", en: "Wheat flour, palm oil, sauce (chicken extract, chili pepper, soy sauce, sugar)" },
    allergens: { uk: "Пшениця, соя, курка, кунжут", ru: "Пшеница, соя, курица, кунжут", en: "Wheat, soy, chicken, sesame" },
    nutrition: n(425, 15, 63, 6, 9, 2.6),
  },
  {
    slug: "lotte-pepero-original", country: "KR", category: "cookies", brand: "Lotte", price: 79, weight: 47,
    tags: ["sweet", "chocolate", "classic", "crunchy"], isPopular: true, stock: 90,
    name: { uk: "Lotte Pepero Original", ru: "Lotte Pepero Original", en: "Lotte Pepero Original" },
    short: { uk: "Хрусткі палички в шоколаді — головний корейський снек", ru: "Хрустящие палочки в шоколаде — главный корейский снек", en: "Crunchy chocolate-dipped sticks — Korea’s favourite snack" },
    desc: { uk: "Класичні палички Пеперо, вкриті молочним шоколадом. В Кореї навіть є окреме свято — День Пеперо 11 листопада.", ru: "Классические палочки Пеперо в молочном шоколаде. В Корее есть даже отдельный праздник — День Пеперо 11 ноября.", en: "Classic Pepero sticks coated in milk chocolate. Korea even has Pepero Day on November 11." },
    ingredients: { uk: "Пшеничне борошно, цукор, какао-масло, сухе молоко, рослинний жир", ru: "Пшеничная мука, сахар, какао-масло, сухое молоко, растительный жир", en: "Wheat flour, sugar, cocoa butter, milk powder, vegetable fat" },
    allergens: { uk: "Пшениця, молоко, соя", ru: "Пшеница, молоко, соя", en: "Wheat, milk, soy" },
    nutrition: n(500, 23, 66, 32, 7, 0.4),
  },
  {
    slug: "orion-choco-pie", country: "KR", category: "cookies", brand: "Orion", price: 249, compareAt: 289, weight: 468,
    tags: ["sweet", "chocolate", "classic", "creamy"], isPopular: true, stock: 40,
    name: { uk: "Orion Choco Pie (12 шт)", ru: "Orion Choco Pie (12 шт)", en: "Orion Choco Pie (12 pcs)" },
    short: { uk: "Той самий корейський Чокопай з маршмелоу", ru: "Тот самый корейский Чокопай с маршмеллоу", en: "The original Korean Choco Pie with marshmallow" },
    desc: { uk: "М’які бісквіти з маршмелоу в шоколадній глазурі. Коробка на 12 штук — для друзів, офісу або себе.", ru: "Мягкие бисквиты с маршмеллоу в шоколадной глазури. Коробка на 12 штук — для друзей, офиса или себя.", en: "Soft sponge cakes with marshmallow in chocolate coating. A box of 12 — for friends, the office or yourself." },
    ingredients: { uk: "Цукор, пшеничне борошно, рослинний жир, какао, желатин, яйця", ru: "Сахар, пшеничная мука, растительный жир, какао, желатин, яйца", en: "Sugar, wheat flour, vegetable fat, cocoa, gelatin, eggs" },
    allergens: { uk: "Пшениця, яйця, молоко, соя", ru: "Пшеница, яйца, молоко, соя", en: "Wheat, eggs, milk, soy" },
    nutrition: n(430, 17, 66, 38, 4, 0.3),
  },
  {
    slug: "binggrae-banana-milk", country: "KR", category: "drinks", brand: "Binggrae", price: 89, volume: 200,
    tags: ["sweet", "drink", "milky", "fruity", "classic", "bottle"], isFeatured: true, isPopular: true, stock: 60,
    name: { uk: "Binggrae Banana Milk", ru: "Binggrae Banana Milk", en: "Binggrae Banana Milk" },
    short: { uk: "Бананове молоко в культовій пляшечці-«глечику»", ru: "Банановое молоко в культовой бутылочке-«кувшинчике»", en: "Banana milk in the iconic little jug bottle" },
    desc: { uk: "Ніжне бананове молоко, яке корейці п’ють з 1974 року. Ідеально охолодженим.", ru: "Нежное банановое молоко, которое корейцы пьют с 1974 года. Идеально охлаждённым.", en: "Smooth banana milk Koreans have loved since 1974. Best served chilled." },
    ingredients: { uk: "Молоко, вода, цукор, банановий сік, ароматизатор", ru: "Молоко, вода, сахар, банановый сок, ароматизатор", en: "Milk, water, sugar, banana juice, flavouring" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(104, 3, 16, 14, 3, 0.1),
    variants: [
      { suffix: "1", name: { uk: "1 шт", ru: "1 шт", en: "Single" }, price: 89, stock: 60 },
      { suffix: "6", name: { uk: "6 шт", ru: "6 шт", en: "6-pack" }, price: 499, compareAt: 534, stock: 12 },
    ],
  },
  {
    slug: "lotte-milkis-original", country: "KR", category: "drinks", brand: "Lotte", price: 69, volume: 250,
    tags: ["sweet", "drink", "milky", "unusual", "fizzy"], stock: 70,
    name: { uk: "Lotte Milkis Original", ru: "Lotte Milkis Original", en: "Lotte Milkis Original" },
    short: { uk: "Газований молочний напій — смак, якого ви ще не знаєте", ru: "Газированный молочный напиток — вкус, которого вы ещё не знаете", en: "A fizzy milk soda — a taste you haven’t met yet" },
    desc: { uk: "Мілкіс — поєднання газованої води та молока з йогуртовими нотками. Дивно звучить, неймовірно смакує.", ru: "Милкис — сочетание газировки и молока с йогуртовыми нотками. Странно звучит, невероятно на вкус.", en: "Milkis combines soda and milk with a yoghurt-like note. Sounds weird, tastes amazing." },
    ingredients: { uk: "Газована вода, цукор, сухе молоко, регулятор кислотності, ароматизатор", ru: "Газированная вода, сахар, сухое молоко, регулятор кислотности, ароматизатор", en: "Carbonated water, sugar, milk powder, acidity regulator, flavouring" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(52, 0, 13, 12, 0.3, 0.05),
  },
  {
    slug: "haitai-honey-butter-chip", country: "KR", category: "snacks", brand: "Haitai", price: 119, weight: 60,
    tags: ["salty", "sweet", "snack", "crunchy", "unusual"], isNew: true, stock: 45,
    name: { uk: "Haitai Honey Butter Chip", ru: "Haitai Honey Butter Chip", en: "Haitai Honey Butter Chip" },
    short: { uk: "Картопляні чипси з медом і вершковим маслом", ru: "Картофельные чипсы с мёдом и сливочным маслом", en: "Potato chips with honey and butter" },
    desc: { uk: "Чипси, через які в Кореї стояли черги. Солодко-солоний баланс меду та вершкового масла.", ru: "Чипсы, за которыми в Корее стояли очереди. Сладко-солёный баланс мёда и сливочного масла.", en: "The chips Koreans once queued for. A sweet-salty balance of honey and butter." },
    ingredients: { uk: "Картопля, рослинна олія, цукор, мед, вершкове масло, сіль", ru: "Картофель, растительное масло, сахар, мёд, сливочное масло, соль", en: "Potatoes, vegetable oil, sugar, honey, butter, salt" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(550, 34, 55, 12, 5, 0.8),
  },
  {
    slug: "nongshim-shrimp-crackers", country: "KR", category: "snacks", brand: "Nongshim", price: 89, weight: 75,
    tags: ["salty", "snack", "crunchy", "classic", "seafood"], stock: 3,
    name: { uk: "Nongshim Shrimp Crackers", ru: "Nongshim Shrimp Crackers", en: "Nongshim Shrimp Crackers" },
    short: { uk: "Креветкові палички Саеуккан — хруст із 1971 року", ru: "Креветочные палочки Саеуккан — хруст с 1971 года", en: "Saeukkang shrimp sticks — crunching since 1971" },
    desc: { uk: "Легкі хрусткі палички зі справжніми креветками. Небезпечно — неможливо зупинитись.", ru: "Лёгкие хрустящие палочки с настоящими креветками. Опасно — невозможно остановиться.", en: "Light, crunchy sticks made with real shrimp. Dangerously moreish." },
    ingredients: { uk: "Пшеничне борошно, креветки (8%), рослинна олія, цукор, сіль", ru: "Пшеничная мука, креветки (8%), растительное масло, сахар, соль", en: "Wheat flour, shrimp (8%), vegetable oil, sugar, salt" },
    allergens: { uk: "Пшениця, ракоподібні, соя", ru: "Пшеница, ракообразные, соя", en: "Wheat, crustaceans, soy" },
    nutrition: n(490, 22, 67, 8, 6, 1.4),
  },

  // ─── JAPAN (8) ─────────────────────────────────────────────
  {
    slug: "meiji-kinoko-no-yama", country: "JP", category: "chocolate", brand: "Meiji", price: 139, weight: 74,
    tags: ["sweet", "chocolate", "classic", "crunchy", "cute"], isFeatured: true, stock: 50,
    name: { uk: "Meiji Kinoko no Yama", ru: "Meiji Kinoko no Yama", en: "Meiji Kinoko no Yama" },
    short: { uk: "Шоколадні «грибочки» на хрусткій ніжці", ru: "Шоколадные «грибочки» на хрустящей ножке", en: "Chocolate mushrooms on crunchy cracker stems" },
    desc: { uk: "Японська класика: печиво-ніжка і шапочка з двох видів шоколаду. Вічна суперечка з фанатами Takenoko no Sato.", ru: "Японская классика: печенье-ножка и шляпка из двух видов шоколада. Вечный спор с фанатами Takenoko no Sato.", en: "A Japanese classic: cracker stems with two-layer chocolate caps. Forever rivals with Takenoko no Sato." },
    ingredients: { uk: "Цукор, пшеничне борошно, какао-маса, сухе молоко, какао-масло", ru: "Сахар, пшеничная мука, какао-масса, сухое молоко, какао-масло", en: "Sugar, wheat flour, cocoa mass, milk powder, cocoa butter" },
    allergens: { uk: "Пшениця, молоко, соя", ru: "Пшеница, молоко, соя", en: "Wheat, milk, soy" },
    nutrition: n(560, 34, 56, 40, 7, 0.3),
  },
  {
    slug: "glico-pocky-strawberry", country: "JP", category: "cookies", brand: "Glico", price: 99, weight: 55,
    tags: ["sweet", "fruity", "crunchy", "cute", "classic"], isPopular: true, stock: 65,
    name: { uk: "Glico Pocky Strawberry", ru: "Glico Pocky Strawberry", en: "Glico Pocky Strawberry" },
    short: { uk: "Полуничні Pocky — ніжна глазур і хрусткий бісквіт", ru: "Клубничные Pocky — нежная глазурь и хрустящий бисквит", en: "Strawberry Pocky — creamy coating, crunchy biscuit" },
    desc: { uk: "Хрусткі бісквітні палички в полуничній глазурі з шматочками ягід. Ідеальний перекус до чаю.", ru: "Хрустящие бисквитные палочки в клубничной глазури с кусочками ягод. Идеальный перекус к чаю.", en: "Crunchy biscuit sticks in strawberry cream with real fruit bits. The perfect tea-time snack." },
    ingredients: { uk: "Пшеничне борошно, цукор, рослинний жир, полуничний порошок, сухе молоко", ru: "Пшеничная мука, сахар, растительный жир, клубничный порошок, сухое молоко", en: "Wheat flour, sugar, vegetable fat, strawberry powder, milk powder" },
    allergens: { uk: "Пшениця, молоко, соя", ru: "Пшеница, молоко, соя", en: "Wheat, milk, soy" },
    nutrition: n(500, 22, 68, 36, 7, 0.4),
  },
  {
    slug: "kitkat-matcha-mini", country: "JP", category: "chocolate", brand: "Nestlé Japan", price: 229, compareAt: 259, weight: 139,
    tags: ["sweet", "unusual", "matcha", "chocolate", "creamy"], isLimited: true, isFeatured: true, isNew: true, stock: 18,
    name: { uk: "KitKat Matcha Mini (12 шт)", ru: "KitKat Matcha Mini (12 шт)", en: "KitKat Matcha Mini (12 pcs)" },
    short: { uk: "Японський KitKat з зеленим чаєм матча", ru: "Японский KitKat с зелёным чаем матча", en: "Japanese KitKat with matcha green tea" },
    desc: { uk: "Лімітований KitKat з Японії: вафлі в білому шоколаді з матчею з Удзі. Трав’янистий, вершковий і не надто солодкий.", ru: "Лимитированный KitKat из Японии: вафли в белом шоколаде с матчей из Удзи. Травянистый, сливочный и не слишком сладкий.", en: "Limited Japanese KitKat: wafers in white chocolate with Uji matcha. Grassy, creamy and not too sweet." },
    ingredients: { uk: "Цукор, сухе молоко, какао-масло, пшеничне борошно, порошок матча (1%)", ru: "Сахар, сухое молоко, какао-масло, пшеничная мука, порошок матча (1%)", en: "Sugar, milk powder, cocoa butter, wheat flour, matcha powder (1%)" },
    allergens: { uk: "Пшениця, молоко, соя", ru: "Пшеница, молоко, соя", en: "Wheat, milk, soy" },
    nutrition: n(540, 30, 60, 50, 7, 0.2),
  },
  {
    slug: "ramune-original", country: "JP", category: "drinks", brand: "Hata Kosen", price: 119, volume: 200,
    tags: ["sweet", "drink", "fizzy", "unusual", "fruity", "bottle", "cute"], isPopular: true, isFeatured: true, stock: 55,
    name: { uk: "Ramune Original", ru: "Ramune Original", en: "Ramune Original" },
    short: { uk: "Японська газована вода з кулькою в горлечку", ru: "Японская газировка с шариком в горлышке", en: "Japanese soda sealed with a glass marble" },
    desc: { uk: "Натисніть на кульку, почуйте «пшш» — і ви на японському літньому фестивалі. Легкий лимонадний смак.", ru: "Нажмите на шарик, услышьте «пшш» — и вы на японском летнем фестивале. Лёгкий лимонадный вкус.", en: "Pop the marble, hear the fizz — you’re at a Japanese summer festival. Light lemonade flavour." },
    ingredients: { uk: "Вода, цукор, діоксид вуглецю, лимонна кислота, ароматизатор", ru: "Вода, сахар, диоксид углерода, лимонная кислота, ароматизатор", en: "Water, sugar, carbon dioxide, citric acid, flavouring" },
    allergens: { uk: "Не містить основних алергенів", ru: "Не содержит основных аллергенов", en: "No major allergens" },
    nutrition: n(40, 0, 10, 10, 0, 0),
  },
  {
    slug: "calpis-water", country: "JP", category: "drinks", brand: "Asahi", price: 109, volume: 500,
    tags: ["sweet", "drink", "milky", "unusual", "bottle"], stock: 35,
    name: { uk: "Calpis Water", ru: "Calpis Water", en: "Calpis Water" },
    short: { uk: "Освіжаючий кисломолочний напій з Японії", ru: "Освежающий кисломолочный напиток из Японии", en: "Refreshing cultured-milk drink from Japan" },
    desc: { uk: "Легкий, трохи кислуватий і освіжаючий — Calpis п’ють у Японії понад 100 років.", ru: "Лёгкий, слегка кисловатый и освежающий — Calpis пьют в Японии более 100 лет.", en: "Light, slightly tangy and refreshing — Japan has been drinking Calpis for over 100 years." },
    ingredients: { uk: "Вода, цукор, сквашене знежирене молоко, регулятор кислотності", ru: "Вода, сахар, сквашенное обезжиренное молоко, регулятор кислотности", en: "Water, sugar, cultured skim milk, acidity regulator" },
    allergens: { uk: "Молоко, соя", ru: "Молоко, соя", en: "Milk, soy" },
    nutrition: n(45, 0, 11, 11, 0.3, 0.04),
  },
  {
    slug: "nissin-cup-noodle-seafood", country: "JP", category: "noodles", brand: "Nissin", price: 99, weight: 75, spice: 0,
    tags: ["salty", "hot-meal", "seafood", "classic"], stock: 40,
    name: { uk: "Nissin Cup Noodle Seafood", ru: "Nissin Cup Noodle Seafood", en: "Nissin Cup Noodle Seafood" },
    short: { uk: "Японська локшина в стаканчику з морепродуктами", ru: "Японская лапша в стаканчике с морепродуктами", en: "Japanese cup noodles with seafood" },
    desc: { uk: "Оригінальний Cup Noodle з вершковим бульйоном, кальмарами, креветками і крабовими паличками.", ru: "Оригинальный Cup Noodle со сливочным бульоном, кальмарами, креветками и крабовыми палочками.", en: "The original Cup Noodle with creamy broth, squid, shrimp and crab sticks." },
    ingredients: { uk: "Пшенична локшина, свинячий жир, кальмари, креветки, капуста, сухе молоко", ru: "Пшеничная лапша, свиной жир, кальмары, креветки, капуста, сухое молоко", en: "Wheat noodles, pork fat, squid, shrimp, cabbage, milk powder" },
    allergens: { uk: "Пшениця, молоко, ракоподібні, молюски, соя", ru: "Пшеница, молоко, ракообразные, моллюски, соя", en: "Wheat, milk, crustaceans, molluscs, soy" },
    nutrition: n(450, 19, 58, 4, 10, 4.6),
  },
  {
    slug: "calbee-jagarico-salad", country: "JP", category: "snacks", brand: "Calbee", price: 89, weight: 57,
    tags: ["salty", "snack", "crunchy", "classic"], isNew: true, stock: 0,
    name: { uk: "Calbee Jagarico Salad", ru: "Calbee Jagarico Salad", en: "Calbee Jagarico Salad" },
    short: { uk: "Хрусткі картопляні палички у стаканчику", ru: "Хрустящие картофельные палочки в стаканчике", en: "Crunchy potato sticks in a cup" },
    desc: { uk: "Jagarico — це картопляні палички з овочами та зеленню. Щільні, хрусткі й дуже японські.", ru: "Jagarico — картофельные палочки с овощами и зеленью. Плотные, хрустящие и очень японские.", en: "Jagarico are potato sticks with vegetables and herbs. Dense, crunchy and very Japanese." },
    ingredients: { uk: "Картопля, рослинна олія, сухе молоко, морква, петрушка, сіль", ru: "Картофель, растительное масло, сухое молоко, морковь, петрушка, соль", en: "Potatoes, vegetable oil, milk powder, carrot, parsley, salt" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(520, 29, 58, 3, 6, 1.2),
  },
  {
    slug: "morinaga-hi-chew-grape", country: "JP", category: "gummies", brand: "Morinaga", price: 69, weight: 55,
    tags: ["sweet", "fruity", "chewy", "cute", "classic"], isPopular: true, stock: 100,
    name: { uk: "Morinaga Hi-Chew Grape", ru: "Morinaga Hi-Chew Grape", en: "Morinaga Hi-Chew Grape" },
    short: { uk: "Супертягучі японські цукерки зі смаком винограду", ru: "Супертягучие японские конфеты со вкусом винограда", en: "Super-chewy Japanese grape candies" },
    desc: { uk: "Hi-Chew — щось середнє між жуйкою і тягучкою. Яскравий смак стиглого винограду.", ru: "Hi-Chew — что-то среднее между жвачкой и тянучкой. Яркий вкус спелого винограда.", en: "Hi-Chew sits somewhere between gum and taffy. A bright ripe-grape flavour." },
    ingredients: { uk: "Цукор, глюкозний сироп, рослинна олія, виноградний сік, желатин", ru: "Сахар, глюкозный сироп, растительное масло, виноградный сок, желатин", en: "Sugar, glucose syrup, vegetable oil, grape juice, gelatin" },
    allergens: { uk: "Може містити сліди молока", ru: "Может содержать следы молока", en: "May contain traces of milk" },
    nutrition: n(400, 7, 84, 60, 0.5, 0),
  },

  // ─── CHINA (7) ─────────────────────────────────────────────
  {
    slug: "want-want-senbei", country: "CN", category: "snacks", brand: "Want Want", price: 89, weight: 112,
    tags: ["salty", "sweet", "snack", "crunchy", "classic"], stock: 50,
    name: { uk: "Want Want Senbei", ru: "Want Want Senbei", en: "Want Want Senbei" },
    short: { uk: "Рисові крекери з солодко-солоною глазур’ю", ru: "Рисовые крекеры со сладко-солёной глазурью", en: "Rice crackers with a sweet-savoury glaze" },
    desc: { uk: "Легкі хрусткі рисові крекери — найвідоміший снек бренду Want Want.", ru: "Лёгкие хрустящие рисовые крекеры — самый известный снек бренда Want Want.", en: "Light, crunchy rice crackers — Want Want’s signature snack." },
    ingredients: { uk: "Рис, рослинна олія, цукор, крохмаль, сіль", ru: "Рис, растительное масло, сахар, крахмал, соль", en: "Rice, vegetable oil, sugar, starch, salt" },
    allergens: { uk: "Може містити сліди молока та сої", ru: "Может содержать следы молока и сои", en: "May contain milk and soy" },
    nutrition: n(470, 17, 75, 12, 5, 1.1),
  },
  {
    slug: "white-rabbit-creamy-candy", country: "CN", category: "candy", brand: "White Rabbit", price: 129, weight: 180,
    tags: ["sweet", "milky", "chewy", "classic", "unusual"], isPopular: true, stock: 44,
    name: { uk: "White Rabbit Creamy Candy", ru: "White Rabbit Creamy Candy", en: "White Rabbit Creamy Candy" },
    short: { uk: "Молочні ірис-цукерки з їстівною рисовою обгорткою", ru: "Молочные ирис-конфеты со съедобной рисовой обёрткой", en: "Milk candies in an edible rice-paper wrapper" },
    desc: { uk: "Культові шанхайські цукерки з 1943 року. Внутрішню рисову обгортку можна (і треба) їсти.", ru: "Культовые шанхайские конфеты с 1943 года. Внутреннюю рисовую обёртку можно (и нужно) есть.", en: "Iconic Shanghai candy since 1943. The inner rice-paper wrapper is edible — eat it!" },
    ingredients: { uk: "Цукор, сухе молоко, кукурудзяний сироп, вершкове масло, рисовий папір", ru: "Сахар, сухое молоко, кукурузный сироп, сливочное масло, рисовая бумага", en: "Sugar, milk powder, corn syrup, butter, rice paper" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(440, 10, 80, 60, 5, 0.3),
  },
  {
    slug: "wei-long-latiao", country: "CN", category: "spicy", brand: "Wei Long", price: 69, weight: 106, spice: 3,
    tags: ["spicy", "chewy", "unusual", "snack", "salty"], isNew: true, isPopular: true, stock: 70,
    name: { uk: "Wei Long Latiao", ru: "Wei Long Latiao", en: "Wei Long Latiao" },
    short: { uk: "Гострі пшеничні стрипси — вірусний снек Китаю", ru: "Острые пшеничные стрипсы — вирусный снек Китая", en: "Spicy wheat-gluten strips — China’s viral snack" },
    desc: { uk: "Латяо — жувальні стрипси в олії з чилі й сичуанським перцем. Солоно, гостро, дивно — і дуже залипально.", ru: "Латяо — жевательные стрипсы в масле с чили и сычуаньским перцем. Солёно, остро, странно — и очень залипательно.", en: "Latiao are chewy strips in chili oil with Sichuan pepper. Salty, spicy, strange — and addictive." },
    ingredients: { uk: "Пшеничне борошно, соєва олія, перець чилі, сичуанський перець, сіль, цукор", ru: "Пшеничная мука, соевое масло, перец чили, сычуаньский перец, соль, сахар", en: "Wheat flour, soybean oil, chili pepper, Sichuan pepper, salt, sugar" },
    allergens: { uk: "Пшениця, соя", ru: "Пшеница, соя", en: "Wheat, soy" },
    nutrition: n(390, 18, 45, 10, 11, 3.5),
  },
  {
    slug: "lao-gan-ma-chili-crisp", country: "CN", category: "spicy", brand: "Lao Gan Ma", price: 199, weight: 210, spice: 3,
    tags: ["spicy", "salty", "unusual", "jar", "cooking"], isFeatured: true, stock: 25,
    name: { uk: "Lao Gan Ma Chili Crisp", ru: "Lao Gan Ma Chili Crisp", en: "Lao Gan Ma Chili Crisp" },
    short: { uk: "Легендарна хрустка олія чилі з Гуйчжоу", ru: "Легендарное хрустящее масло чили из Гуйчжоу", en: "The legendary crispy chili oil from Guizhou" },
    desc: { uk: "Хрусткий чилі, смажена цибуля та соєві боби в ароматній олії. Додайте до локшини, яєць, піци — до всього.", ru: "Хрустящий чили, жареный лук и соевые бобы в ароматном масле. Добавьте к лапше, яйцам, пицце — ко всему.", en: "Crispy chili, fried onion and soybeans in fragrant oil. Add to noodles, eggs, pizza — everything." },
    ingredients: { uk: "Рослинна олія, перець чилі, цибуля, соєві боби, сіль, цукор", ru: "Растительное масло, перец чили, лук, соевые бобы, соль, сахар", en: "Vegetable oil, chili, onion, soybeans, salt, sugar" },
    allergens: { uk: "Соя", ru: "Соя", en: "Soy" },
    nutrition: n(620, 60, 12, 3, 5, 4.2),
  },
  {
    slug: "master-kong-braised-beef-noodles", country: "CN", category: "noodles", brand: "Master Kong", price: 59, weight: 104, spice: 1,
    tags: ["salty", "hot-meal", "classic"], stock: 90,
    name: { uk: "Master Kong Braised Beef", ru: "Master Kong Braised Beef", en: "Master Kong Braised Beef" },
    short: { uk: "Локшина з тушкованою яловичиною — смак Китаю №1", ru: "Лапша с тушёной говядиной — вкус Китая №1", en: "Braised beef noodles — China’s №1 flavour" },
    desc: { uk: "Найпродаваніша локшина Китаю: насичений яловичий бульйон з соєвим соусом і спеціями.", ru: "Самая продаваемая лапша Китая: насыщенный говяжий бульон с соевым соусом и специями.", en: "China’s best-selling noodle: a rich beef broth with soy sauce and spices." },
    ingredients: { uk: "Пшеничне борошно, пальмова олія, сіль, соєвий соус, яловичий екстракт, спеції", ru: "Пшеничная мука, пальмовое масло, соль, соевый соус, говяжий экстракт, специи", en: "Wheat flour, palm oil, salt, soy sauce, beef extract, spices" },
    allergens: { uk: "Пшениця, соя, яловичина", ru: "Пшеница, соя, говядина", en: "Wheat, soy, beef" },
    nutrition: n(460, 19, 62, 3, 9, 5),
  },
  {
    slug: "wong-lo-kat-herbal-tea", country: "CN", category: "drinks", brand: "Wong Lo Kat", price: 59, volume: 310,
    tags: ["drink", "unusual", "herbal"], stock: 40,
    name: { uk: "Wong Lo Kat Herbal Tea", ru: "Wong Lo Kat Herbal Tea", en: "Wong Lo Kat Herbal Tea" },
    short: { uk: "Китайський трав’яний чай у бляшанці", ru: "Китайский травяной чай в банке", en: "Chinese herbal tea in a can" },
    desc: { uk: "Солодкуватий охолоджуючий трав’яний напій — у Китаї його п’ють до гострої їжі.", ru: "Сладковатый охлаждающий травяной напиток — в Китае его пьют к острой еде.", en: "A sweet, cooling herbal drink — in China it’s the classic pairing for spicy food." },
    ingredients: { uk: "Вода, цукор, екстракти трав (мезона, хризантема, жимолость)", ru: "Вода, сахар, экстракты трав (мезона, хризантема, жимолость)", en: "Water, sugar, herbal extracts (mesona, chrysanthemum, honeysuckle)" },
    allergens: { uk: "Не містить основних алергенів", ru: "Не содержит основных аллергенов", en: "No major allergens" },
    nutrition: n(38, 0, 9, 9, 0, 0),
  },
  {
    slug: "want-want-hot-kid-milk", country: "CN", category: "drinks", brand: "Want Want", price: 79, volume: 245,
    tags: ["sweet", "drink", "milky", "cute", "classic"], isNew: true, stock: 30,
    name: { uk: "Want Want Hot-Kid Milk", ru: "Want Want Hot-Kid Milk", en: "Want Want Hot-Kid Milk" },
    short: { uk: "Солодке молоко в банці з культовим хлопчиком", ru: "Сладкое молоко в банке с культовым мальчиком", en: "Sweet milk in the can with the iconic kid" },
    desc: { uk: "Wangzai Milk — дитинство мільйонів китайців. Ніжне, вершкове, у яскравій червоній банці.", ru: "Wangzai Milk — детство миллионов китайцев. Нежное, сливочное, в яркой красной банке.", en: "Wangzai Milk is the childhood drink of millions in China. Smooth and creamy in a bright red can." },
    ingredients: { uk: "Вода, сухе молоко, цукор, стабілізатори", ru: "Вода, сухое молоко, сахар, стабилизаторы", en: "Water, milk powder, sugar, stabilisers" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(75, 3, 10, 9, 2.3, 0.1),
  },

  // ─── USA (7) ───────────────────────────────────────────────
  {
    slug: "reeses-peanut-butter-cups", country: "US", category: "chocolate", brand: "Reese’s", price: 89, weight: 42,
    tags: ["sweet", "chocolate", "salty", "classic", "creamy"], isPopular: true, stock: 80,
    name: { uk: "Reese’s Peanut Butter Cups", ru: "Reese’s Peanut Butter Cups", en: "Reese’s Peanut Butter Cups" },
    short: { uk: "Шоколадні кошики з арахісовою пастою", ru: "Шоколадные корзиночки с арахисовой пастой", en: "Milk chocolate cups filled with peanut butter" },
    desc: { uk: "Американська класика: молочний шоколад і солонувата арахісова паста. Дві штуки в упаковці.", ru: "Американская классика: молочный шоколад и солоноватая арахисовая паста. Две штуки в упаковке.", en: "An American classic: milk chocolate and slightly salty peanut butter. Two cups per pack." },
    ingredients: { uk: "Молочний шоколад, арахіс, цукор, декстроза, сіль", ru: "Молочный шоколад, арахис, сахар, декстроза, соль", en: "Milk chocolate, peanuts, sugar, dextrose, salt" },
    allergens: { uk: "Арахіс, молоко, соя", ru: "Арахис, молоко, соя", en: "Peanuts, milk, soy" },
    nutrition: n(520, 30, 55, 48, 10, 0.9),
  },
  {
    slug: "hersheys-cookies-n-creme", country: "US", category: "chocolate", brand: "Hershey’s", price: 79, weight: 43,
    tags: ["sweet", "chocolate", "crunchy", "creamy"], stock: 60,
    name: { uk: "Hershey’s Cookies ’n’ Creme", ru: "Hershey’s Cookies ’n’ Creme", en: "Hershey’s Cookies ’n’ Creme" },
    short: { uk: "Білий шоколад із шматочками шоколадного печива", ru: "Белый шоколад с кусочками шоколадного печенья", en: "White chocolate with chocolate cookie bits" },
    desc: { uk: "Вершковий білий шоколад і хрусткі шматочки печива — як мілкшейк у формі батончика.", ru: "Сливочный белый шоколад и хрустящие кусочки печенья — как милкшейк в форме батончика.", en: "Creamy white chocolate with crunchy cookie bits — a milkshake in bar form." },
    ingredients: { uk: "Цукор, рослинний жир, сухе молоко, пшеничне борошно, какао", ru: "Сахар, растительный жир, сухое молоко, пшеничная мука, какао", en: "Sugar, vegetable fat, milk powder, wheat flour, cocoa" },
    allergens: { uk: "Молоко, пшениця, соя", ru: "Молоко, пшеница, соя", en: "Milk, wheat, soy" },
    nutrition: n(540, 30, 62, 50, 6, 0.5),
  },
  {
    slug: "takis-fuego", country: "US", category: "spicy", brand: "Takis", price: 149, weight: 92, spice: 4,
    tags: ["spicy", "salty", "snack", "crunchy", "extreme"], isPopular: true, isFeatured: true, stock: 55,
    name: { uk: "Takis Fuego", ru: "Takis Fuego", en: "Takis Fuego" },
    short: { uk: "Кукурудзяні ролли з гострим чилі та лаймом", ru: "Кукурузные роллы с острым чили и лаймом", en: "Rolled tortilla chips with hot chili & lime" },
    desc: { uk: "Скручені тортилья-чипси з інтенсивним чилі та кислим лаймом. Пальці стануть червоними — це нормально.", ru: "Скрученные тортилья-чипсы с интенсивным чили и кислым лаймом. Пальцы станут красными — это нормально.", en: "Rolled tortilla chips with intense chili and tangy lime. Red fingers are part of the deal." },
    ingredients: { uk: "Кукурудзяне борошно, рослинна олія, сіль, лимонна кислота, перець чилі, барвник", ru: "Кукурузная мука, растительное масло, соль, лимонная кислота, перец чили, краситель", en: "Corn masa flour, vegetable oil, salt, citric acid, chili pepper, colour" },
    allergens: { uk: "Може містити пшеницю, молоко, сою", ru: "Может содержать пшеницу, молоко, сою", en: "May contain wheat, milk, soy" },
    nutrition: n(500, 26, 61, 2, 6, 1.9),
  },
  {
    slug: "cheetos-flamin-hot", country: "US", category: "spicy", brand: "Cheetos", price: 219, weight: 226, spice: 3,
    tags: ["spicy", "salty", "snack", "crunchy"], isLimited: true, stock: 4,
    name: { uk: "Cheetos Flamin’ Hot", ru: "Cheetos Flamin’ Hot", en: "Cheetos Flamin’ Hot" },
    short: { uk: "Гострі сирні палички у великій американській пачці", ru: "Острые сырные палочки в большой американской пачке", en: "Spicy cheese puffs in a big US bag" },
    desc: { uk: "Хрусткі сирні палички з вогняною приправою. Велика пачка 226 г — для компанії.", ru: "Хрустящие сырные палочки с огненной приправой. Большая пачка 226 г — для компании.", en: "Crunchy cheese puffs with fiery seasoning. A big 226 g bag for sharing." },
    ingredients: { uk: "Кукурудзяна крупа, рослинна олія, сирний порошок, перець чилі, сіль", ru: "Кукурузная крупа, растительное масло, сырный порошок, перец чили, соль", en: "Enriched corn meal, vegetable oil, cheese powder, chili, salt" },
    allergens: { uk: "Молоко", ru: "Молоко", en: "Milk" },
    nutrition: n(570, 37, 53, 2, 5, 1.6),
  },
  {
    slug: "oreo-double-stuf", country: "US", category: "cookies", brand: "Oreo", price: 129, weight: 157,
    tags: ["sweet", "chocolate", "creamy", "classic"], stock: 38,
    name: { uk: "Oreo Double Stuf", ru: "Oreo Double Stuf", en: "Oreo Double Stuf" },
    short: { uk: "Oreo з подвійною порцією крему — американська версія", ru: "Oreo с двойной порцией крема — американская версия", en: "Oreo with twice the creme — the US edition" },
    desc: { uk: "Американський Oreo з подвійним шаром ванільного крему. Покрутити, лизнути, вмочити в молоко.", ru: "Американский Oreo с двойным слоем ванильного крема. Покрутить, лизнуть, обмакнуть в молоко.", en: "American Oreo with a double layer of vanilla creme. Twist, lick, dunk." },
    ingredients: { uk: "Цукор, пшеничне борошно, рослинна олія, какао, кукурудзяний сироп", ru: "Сахар, пшеничная мука, растительное масло, какао, кукурузный сироп", en: "Sugar, wheat flour, vegetable oil, cocoa, corn syrup" },
    allergens: { uk: "Пшениця, соя, може містити молоко", ru: "Пшеница, соя, может содержать молоко", en: "Wheat, soy, may contain milk" },
    nutrition: n(490, 23, 70, 42, 4, 0.8),
  },
  {
    slug: "dr-pepper-can", country: "US", category: "drinks", brand: "Dr Pepper", price: 79, volume: 355,
    tags: ["sweet", "drink", "fizzy", "classic", "unusual"], isPopular: true, stock: 75,
    name: { uk: "Dr Pepper", ru: "Dr Pepper", en: "Dr Pepper" },
    short: { uk: "Та сама газована з 23 смаками", ru: "Та самая газировка с 23 вкусами", en: "The soda with 23 flavours" },
    desc: { uk: "Культова американська газована з 1885 року: вишня, ваніль, спеції та ще 20 загадкових нот.", ru: "Культовая американская газировка с 1885 года: вишня, ваниль, специи и ещё 20 загадочных нот.", en: "The cult American soda since 1885: cherry, vanilla, spice and 20 more mystery notes." },
    ingredients: { uk: "Газована вода, кукурудзяний сироп, карамельний колір, фосфорна кислота, кофеїн", ru: "Газированная вода, кукурузный сироп, карамельный колер, фосфорная кислота, кофеин", en: "Carbonated water, corn syrup, caramel colour, phosphoric acid, caffeine" },
    allergens: { uk: "Не містить основних алергенів. Містить кофеїн", ru: "Не содержит основных аллергенов. Содержит кофеин", en: "No major allergens. Contains caffeine" },
    nutrition: n(42, 0, 11, 11, 0, 0.03),
    variants: [
      { suffix: "1", name: { uk: "1 банка", ru: "1 банка", en: "1 can" }, price: 79, stock: 75 },
      { suffix: "6", name: { uk: "6 банок", ru: "6 банок", en: "6 cans" }, price: 449, compareAt: 474, stock: 10 },
    ],
  },
  {
    slug: "airheads-xtremes-rainbow-berry", country: "US", category: "gummies", brand: "Airheads", price: 69, weight: 57,
    tags: ["sweet", "sour", "fruity", "chewy", "unusual"], isNew: true, stock: 48,
    name: { uk: "Airheads Xtremes Rainbow Berry", ru: "Airheads Xtremes Rainbow Berry", en: "Airheads Xtremes Rainbow Berry" },
    short: { uk: "Кислі веселкові стрічки-тягучки", ru: "Кислые радужные ленты-тянучки", en: "Sour rainbow candy belts" },
    desc: { uk: "Кисло-солодкі веселкові стрічки з ягідним смаком. Язик скрутиться — але захочеться ще.", ru: "Кисло-сладкие радужные ленты с ягодным вкусом. Язык свернётся — но захочется ещё.", en: "Sweet-and-sour rainbow belts with a berry flavour. Pucker up — then go back for more." },
    ingredients: { uk: "Цукор, кукурудзяний сироп, пшеничне борошно, лимонна кислота, барвники", ru: "Сахар, кукурузный сироп, пшеничная мука, лимонная кислота, красители", en: "Sugar, corn syrup, wheat flour, citric acid, colours" },
    allergens: { uk: "Пшениця", ru: "Пшеница", en: "Wheat" },
    nutrition: n(370, 2, 86, 55, 2, 0.1),
  },

  // ─── MYSTERY BOXES (5) ─────────────────────────────────────
  {
    slug: "mystery-box-korea", country: "KR", category: "mystery-box", brand: "AsiaShop", price: 799, compareAt: 920,
    tags: ["mystery", "sweet", "salty", "spicy", "unusual"], isFeatured: true, stock: 15,
    name: { uk: "Korea Box", ru: "Korea Box", en: "Korea Box" },
    short: { uk: "8–10 корейських хітів у коробці-сюрпризі", ru: "8–10 корейских хитов в коробке-сюрпризе", en: "8–10 Korean hits in a surprise box" },
    desc: { uk: "Рамен, напій, солодощі й снек — добірка від нашої команди. Вартість вмісту завжди вища за ціну коробки.", ru: "Рамен, напиток, сладости и снек — подборка от нашей команды. Стоимость содержимого всегда выше цены коробки.", en: "Ramyun, a drink, sweets and snacks, curated by our team. Contents are always worth more than the box price." },
    ingredients: { uk: "Склад залежить від вмісту коробки — див. етикетки продуктів", ru: "Состав зависит от содержимого коробки — см. этикетки продуктов", en: "Depends on the contents — see individual product labels" },
    allergens: { uk: "Може містити пшеницю, молоко, сою, арахіс, кунжут", ru: "Может содержать пшеницу, молоко, сою, арахис, кунжут", en: "May contain wheat, milk, soy, peanuts, sesame" },
  },
  {
    slug: "mystery-box-japan", country: "JP", category: "mystery-box", brand: "AsiaShop", price: 899, compareAt: 1040,
    tags: ["mystery", "sweet", "unusual", "cute"], isNew: true, stock: 12,
    name: { uk: "Japan Box", ru: "Japan Box", en: "Japan Box" },
    short: { uk: "Кавайний набір японських смаколиків", ru: "Кавайный набор японских вкусняшек", en: "A kawaii set of Japanese treats" },
    desc: { uk: "Матча, рамуне, Pocky та кілька лімітованих сюрпризів. Ідеальний подарунок для фаната аніме.", ru: "Матча, рамунэ, Pocky и несколько лимитированных сюрпризов. Идеальный подарок для фаната аниме.", en: "Matcha, Ramune, Pocky and a few limited surprises. A perfect gift for anime fans." },
    ingredients: { uk: "Склад залежить від вмісту коробки — див. етикетки продуктів", ru: "Состав зависит от содержимого коробки — см. этикетки продуктов", en: "Depends on the contents — see individual product labels" },
    allergens: { uk: "Може містити пшеницю, молоко, сою", ru: "Может содержать пшеницу, молоко, сою", en: "May contain wheat, milk, soy" },
  },
  {
    slug: "mystery-box-asia-mix", country: null, category: "mystery-box", brand: "AsiaShop", price: 999, compareAt: 1180,
    tags: ["mystery", "sweet", "salty", "spicy", "unusual", "drink"], isPopular: true, stock: 20,
    name: { uk: "Asia Mix Box", ru: "Asia Mix Box", en: "Asia Mix Box" },
    short: { uk: "Корея + Японія + Китай в одній коробці", ru: "Корея + Япония + Китай в одной коробке", en: "Korea + Japan + China in one box" },
    desc: { uk: "Найкращий спосіб почати: 10–12 товарів із трьох країн — солодке, солоне, гостре та напій.", ru: "Лучший способ начать: 10–12 товаров из трёх стран — сладкое, солёное, острое и напиток.", en: "The best way to start: 10–12 items from three countries — sweet, salty, spicy and a drink." },
    ingredients: { uk: "Склад залежить від вмісту коробки — див. етикетки продуктів", ru: "Состав зависит от содержимого коробки — см. этикетки продуктов", en: "Depends on the contents — see individual product labels" },
    allergens: { uk: "Може містити пшеницю, молоко, сою, арахіс, ракоподібних", ru: "Может содержать пшеницу, молоко, сою, арахис, ракообразных", en: "May contain wheat, milk, soy, peanuts, crustaceans" },
  },
  {
    slug: "mystery-box-sweet", country: null, category: "mystery-box", brand: "AsiaShop", price: 649,
    tags: ["mystery", "sweet", "chocolate", "fruity"], stock: 18,
    name: { uk: "Sweet Box", ru: "Sweet Box", en: "Sweet Box" },
    short: { uk: "Тільки солодке: шоколад, тягучки, печиво", ru: "Только сладкое: шоколад, тянучки, печенье", en: "Sweet only: chocolate, chewy candy, cookies" },
    desc: { uk: "Коробка для ласунів: 8–10 солодощів з Азії та США. Без гострого, обіцяємо.", ru: "Коробка для сладкоежек: 8–10 сладостей из Азии и США. Без острого, обещаем.", en: "A box for sweet tooths: 8–10 treats from Asia and the USA. No spice, promise." },
    ingredients: { uk: "Склад залежить від вмісту коробки — див. етикетки продуктів", ru: "Состав зависит от содержимого коробки — см. этикетки продуктов", en: "Depends on the contents — see individual product labels" },
    allergens: { uk: "Може містити пшеницю, молоко, сою, арахіс", ru: "Может содержать пшеницу, молоко, сою, арахис", en: "May contain wheat, milk, soy, peanuts" },
  },
  {
    slug: "mystery-box-spicy", country: null, category: "mystery-box", brand: "AsiaShop", price: 749, spice: 4,
    tags: ["mystery", "spicy", "extreme", "unusual"], isLimited: true, stock: 8,
    name: { uk: "Spicy Box", ru: "Spicy Box", en: "Spicy Box" },
    short: { uk: "Челендж: найгостріше з Кореї, Китаю та США", ru: "Челлендж: самое острое из Кореи, Китая и США", en: "Challenge: the hottest from Korea, China and the USA" },
    desc: { uk: "Buldak, латяо, Takis і секретний фінальний бос. Молоко в комплект не входить.", ru: "Buldak, латяо, Takis и секретный финальный босс. Молоко в комплект не входит.", en: "Buldak, latiao, Takis and a secret final boss. Milk not included." },
    ingredients: { uk: "Склад залежить від вмісту коробки — див. етикетки продуктів", ru: "Состав зависит от содержимого коробки — см. этикетки продуктов", en: "Depends on the contents — see individual product labels" },
    allergens: { uk: "Може містити пшеницю, молоко, сою, кунжут", ru: "Может содержать пшеницу, молоко, сою, кунжут", en: "May contain wheat, milk, soy, sesame" },
  },
];

/**
 * Demo reviewers — each has a consistent persona and language:
 * 0 Олена (uk, sweet tooth) · 1 Дмитро (uk, loves spicy) · 2 Ірина (ru) · 3 Max (en)
 * Reviews are written per product so they match what the product actually is.
 */
export type SeedReview = { by: 0 | 1 | 2 | 3; rating: number; body: string; daysAgo: number };
export const REVIEWER_LOCALE = ["uk", "uk", "ru", "en"] as const;

export const reviews: Record<string, SeedReview[]> = {
  // KOREA
  "nongshim-shin-ramyun": [
    { by: 1, rating: 5, daysAgo: 12, body: "Класика. Гострота помірна, бульйон насичений. Додаю яйце і зелену цибулю — ідеальна вечеря за 5 хвилин." },
    { by: 3, rating: 4, daysAgo: 30, body: "Tastes exactly like the one I had in Seoul. Took one star off: the 5-pack is barely cheaper than singles." },
    { by: 2, rating: 5, daysAgo: 41, body: "Беру пачками по 5. Остроту держит хорошо, лапша не разваривается, если не передержать." },
  ],
  "samyang-buldak-hot-chicken-ramen": [
    { by: 1, rating: 5, daysAgo: 6, body: "Це реально дуже гостро. Я люблю гостре, але з повним пакетиком соусу ледве доїв. Смак при цьому класний — солодкувато-курячий." },
    { by: 3, rating: 4, daysAgo: 19, body: "Did the challenge with friends. Use half the sauce the first time, seriously. Keep milk nearby." },
    { by: 0, rating: 3, daysAgo: 27, body: "Чоловік у захваті, а я після двох виделок пила молоко 😅 Для мене забагато, але якщо любите вогонь — беріть." },
  ],
  "lotte-pepero-original": [
    { by: 0, rating: 5, daysAgo: 9, body: "Шоколаду більше, ніж у звичайних паличках, і він не тане в руках. Брала на День Пеперо подрузі — обидві задоволені." },
    { by: 2, rating: 4, daysAgo: 33, body: "Вкусно, но пачка маленькая — съедается за один сериал." },
  ],
  "orion-choco-pie": [
    { by: 0, rating: 5, daysAgo: 14, body: "Корейський Чокопай м’якший і менш солодкий, ніж наш. Коробки на 12 вистачило на тиждень… на двох." },
    { by: 2, rating: 5, daysAgo: 22, body: "Брала в офис — разобрали за полдня. Маршмеллоу нежный, глазурь нормальная, не восковая." },
    { by: 3, rating: 4, daysAgo: 50, body: "Solid classic. Good value for a 12-box, arrived well packed with no crushed pies." },
  ],
  "binggrae-banana-milk": [
    { by: 0, rating: 5, daysAgo: 4, body: "Те саме бананове молоко з дорам! Смак ніжний, не хімічний. Обов’язково пити холодним." },
    { by: 3, rating: 5, daysAgo: 25, body: "The little jug bottle alone is worth it. Tastes like a banana milkshake, not too sweet." },
  ],
  "lotte-milkis-original": [
    { by: 2, rating: 4, daysAgo: 16, body: "Странно, но вкусно: как газированный йогурт. Второй раз возьму уже упаковку." },
    { by: 1, rating: 3, daysAgo: 38, body: "Спробувати варто, але мені солодкувато. Добре йде після гострої локшини, гасить пекучість." },
  ],
  "haitai-honey-butter-chip": [
    { by: 0, rating: 5, daysAgo: 7, body: "Солодко-солоні, з медовим присмаком. Не думала, що чипси можуть бути такими ніжними." },
    { by: 3, rating: 3, daysAgo: 29, body: "Interesting once, but a bit too sweet for chips in my opinion. Small bag for the price." },
  ],
  "nongshim-shrimp-crackers": [
    { by: 2, rating: 5, daysAgo: 11, body: "Вкус креветки чувствуется по-настоящему. Лёгкие, хрустящие, к пиву идеально." },
    { by: 1, rating: 4, daysAgo: 44, body: "Звичний смак з дитинства тих, хто жив у Кореї 🙂 Хрусткі, не жирні. Хотілося б більшу пачку." },
  ],

  // JAPAN
  "meiji-kinoko-no-yama": [
    { by: 0, rating: 5, daysAgo: 10, body: "Грибочки дуже милі, шоколад якісний — молочний шар і темний. Подарувала подрузі-анімешниці, вона пищала 😄" },
    { by: 3, rating: 4, daysAgo: 35, body: "Team Kinoko forever. Cracker is crunchy, chocolate is good but the box is small." },
  ],
  "glico-pocky-strawberry": [
    { by: 0, rating: 5, daysAgo: 5, body: "Полуничний Pocky — мій фаворит. Глазур зі шматочками ягід, а не просто рожевий шоколад." },
    { by: 2, rating: 4, daysAgo: 26, body: "Вкусно, но сладковато. Хорошо к несладкому чаю." },
  ],
  "kitkat-matcha-mini": [
    { by: 2, rating: 5, daysAgo: 8, body: "Настоящая матча, чувствуется травянистая горчинка. Совсем не приторно, как я боялась." },
    { by: 3, rating: 5, daysAgo: 20, body: "Best KitKat flavour, period. Individually wrapped minis are great for sharing (or not)." },
    { by: 0, rating: 4, daysAgo: 47, body: "Смачно, але звикати треба — смак незвичний, трав’яний. Коробка не дешева, беру як подарунок." },
  ],
  "ramune-original": [
    { by: 3, rating: 5, daysAgo: 3, body: "Opening it is half the fun: push the marble in and hold it for a few seconds or it foams over. Light lemonade taste." },
    { by: 0, rating: 4, daysAgo: 23, body: "Смак як у звичайного лимонаду, але відкривати кульку — окремий атракціон. Брала за досвід, не пошкодувала." },
  ],
  "calpis-water": [
    { by: 2, rating: 5, daysAgo: 18, body: "Кисломолочный вкус, очень освежает в жару. Моё открытие года." },
  ],
  "nissin-cup-noodle-seafood": [
    { by: 1, rating: 4, daysAgo: 13, body: "Не гостра, зате бульйон вершковий і шматочки морепродуктів справжні. Хороший варіант на роботу." },
    { by: 3, rating: 5, daysAgo: 39, body: "The Japanese seafood version is so much better than the export one. Creamy broth, lots of bits." },
  ],
  "calbee-jagarico-salad": [
    { by: 2, rating: 4, daysAgo: 58, body: "Плотные палочки, хрустят громко. Жаль, что сейчас нет в наличии — жду поставку." },
  ],
  "morinaga-hi-chew-grape": [
    { by: 0, rating: 5, daysAgo: 15, body: "Дуже тягучі і яскраво-виноградні. Одна цукерка — і вже тягнешся за другою." },
    { by: 3, rating: 4, daysAgo: 42, body: "Grape Hi-Chew is a classic. Just be careful with fillings, they are really chewy." },
  ],

  // CHINA
  "want-want-senbei": [
    { by: 2, rating: 4, daysAgo: 21, body: "Лёгкие рисовые крекеры, сладко-солёные. Хорошо к чаю, не жирные." },
  ],
  "white-rabbit-creamy-candy": [
    { by: 2, rating: 5, daysAgo: 12, body: "Вкус детства для тех, кто жил в Китае. Молочные, тягучие, рисовую бумажку можно есть — проверено." },
    { by: 0, rating: 5, daysAgo: 31, body: "Як вершкова іриска, але м’якша. Спочатку не повірила, що обгортку їдять 😄" },
  ],
  "wei-long-latiao": [
    { by: 1, rating: 5, daysAgo: 5, body: "Дуже незвично: жувальні, в олії з чилі й сичуанським перцем, який трохи німить язик. Затягує." },
    { by: 3, rating: 3, daysAgo: 24, body: "Tried it because of TikTok. Very oily and very salty. Glad I tried, won't reorder." },
  ],
  "lao-gan-ma-chili-crisp": [
    { by: 1, rating: 5, daysAgo: 9, body: "Додаю до всього: яєчня, пельмені, піца. Хрусткий, ароматний, гострота помірна. Банка на місяць." },
    { by: 3, rating: 5, daysAgo: 28, body: "The legend. More savoury and crunchy than hot. Stir it well before using, the good bits sink." },
    { by: 2, rating: 4, daysAgo: 49, body: "Отличный соус, но масла много. Ложку со дна — и блюдо сразу другое." },
  ],
  "master-kong-braised-beef-noodles": [
    { by: 1, rating: 4, daysAgo: 17, body: "Насичений яловичий бульйон, лише злегка гострий. За свою ціну — дуже гідно." },
  ],
  "wong-lo-kat-herbal-tea": [
    { by: 2, rating: 3, daysAgo: 36, body: "Необычный травяной вкус, немного похож на компот с травами. Брала к острой еде — работает." },
  ],
  "want-want-hot-kid-milk": [],

  // USA
  "reeses-peanut-butter-cups": [
    { by: 3, rating: 5, daysAgo: 7, body: "Tastes exactly like back home. Salty peanut butter + milk chocolate, no notes." },
    { by: 0, rating: 5, daysAgo: 34, body: "Арахісова паста трохи солона — з шоколадом це неймовірно. Беру по дві пачки." },
  ],
  "hersheys-cookies-n-creme": [
    { by: 0, rating: 4, daysAgo: 20, body: "Білий шоколад з печивом, смачно, але дуже солодко. Одного батончика на день достатньо." },
  ],
  "takis-fuego": [
    { by: 1, rating: 5, daysAgo: 4, body: "Гострі й кислі від лайму одночасно. Пальці червоні, язик горить — але не зупинитися." },
    { by: 3, rating: 4, daysAgo: 22, body: "Hotter than Flamin' Hot Cheetos, with a strong lime kick. Pack is 92 g, gone in 10 minutes." },
    { by: 2, rating: 4, daysAgo: 45, body: "Остро и кисло одновременно. Для меня на грани, но муж в восторге." },
  ],
  "cheetos-flamin-hot": [
    { by: 1, rating: 4, daysAgo: 16, body: "Велика пачка, гострота приємна, не вбивча. Ідеально на компанію під фільм." },
    { by: 3, rating: 5, daysAgo: 40, body: "The real US version, not the local one. Big 226 g bag, fairly priced for an import." },
  ],
  "oreo-double-stuf": [
    { by: 0, rating: 5, daysAgo: 11, body: "Крему справді вдвічі більше! Американський Oreo солодший за наш, з молоком — ідеально." },
  ],
  "dr-pepper-can": [
    { by: 3, rating: 5, daysAgo: 6, body: "Finally real Dr Pepper in Dnipro. Cherry-vanilla taste, best served ice cold." },
    { by: 2, rating: 3, daysAgo: 37, body: "На любителя: вкус как у вишнёвой колы с лекарственными нотками. Мужу нравится, мне — нет." },
  ],
  "airheads-xtremes-rainbow-berry": [
    { by: 0, rating: 4, daysAgo: 25, body: "Дуже кислі спочатку, потім солодкі. Веселкові стрічки класно виглядають." },
  ],

  // MYSTERY BOXES
  "mystery-box-korea": [
    { by: 0, rating: 5, daysAgo: 19, body: "Було 10 позицій: Шин Рамьон, бананове молоко, Пеперо, Чокопай і ще кілька снеків, яких я не знала. Вартість вмісту справді більша за ціну коробки." },
    { by: 3, rating: 4, daysAgo: 43, body: "Nice mix of sweet and savoury. Would have liked one more drink, but overall good value." },
  ],
  "mystery-box-japan": [
    { by: 2, rating: 5, daysAgo: 10, body: "Дарила подруге на день рождения — она в восторге от лимитированного KitKat и рамунэ." },
  ],
  "mystery-box-asia-mix": [
    { by: 1, rating: 5, daysAgo: 8, body: "Найкращий спосіб спробувати все одразу. Було солодке, солоне, гостра локшина й напій." },
    { by: 0, rating: 4, daysAgo: 30, body: "Цікаво, але мені потрапило гостре, яке я не їм — віддала чоловікові. В іншому все супер." },
    { by: 3, rating: 5, daysAgo: 52, body: "12 items from three countries, well packed. Great intro box." },
  ],
  "mystery-box-sweet": [
    { by: 0, rating: 5, daysAgo: 14, body: "Рай для ласунів: шоколад, тягучки, печиво, і справді нічого гострого, як і обіцяли." },
  ],
  "mystery-box-spicy": [
    { by: 1, rating: 5, daysAgo: 3, body: "Фінальний бос дійсно бос 🔥 Buldak, латяо, Takis — пройшов усе, молоко знадобилося." },
    { by: 3, rating: 4, daysAgo: 26, body: "Fun challenge box with friends. Not everything is extreme, but the last item definitely is." },
  ],
};
