// Presentation details of website products that are not stored in the database yet (Konten menu, stage 5):
// box contents, Christmas jar counts and photo crops, keyed by product slug. Products, prices, campaigns and quotas
// come from Supabase (src/lib/site/data.ts).

/** Hampers boxes on /hampers ("rangkai bingkisan"). */
export const HAMPERS_BOXES = [
  {
    slug: "blessings-box",
    sub: "paket silaturahmi",
    short: "Pastry, risol, kroket, dan dalgona.",
    items: [
      [4, "Croissant & Cheese Danish"],
      [2, "Mami's Heritage Risol"],
      [2, "Mami's Croquette"],
      [1, "Mami's Creamy Dalgona 500 ml"],
    ],
  },
  {
    slug: "signature-recipe",
    sub: "kue kering warisan",
    short: "3 toples kue kering resep 24 tahun.",
    items: [
      [3, "Toples kue kering resep Mami"],
      [1, "Box hampers wine + pita satin"],
    ],
  },
] as const satisfies readonly { slug: string; sub: string; short: string; items: readonly (readonly [number, string])[] }[];

/** Natal packages: jar count and how the shared photo is cropped per card. */
export const NATAL_PACKAGES: Record<string, { toples: number; zoom: number; origin: string }> = {
  "natal-mini": { toples: 2, zoom: 1.9, origin: "20% 70%" },
  "natal-classic": { toples: 3, zoom: 1.3, origin: "50% 65%" },
  "natal-grande": { toples: 5, zoom: 1, origin: "50% 50%" },
};

export const NATAL_SLUG = "natal-2026";
export const LEBARAN_SLUG = "lebaran-2027";

/** Café menu (dine-in from October 2027). Display only, prices in thousand Rupiah, SAMPLE. */
export const CAFE_MENU = [
  {
    title: "Café",
    fr: "kopi",
    items: [
      { name: "Pistachio Cream Cold Brew", desc: "kopi seduh dingin, pistachio cream foam", price: 42 },
      { name: "White Coffee Latte", desc: "latte lembut dengan susu segar", price: 35 },
      { name: "Mami's Golden Rock Americano", desc: "americano dengan sentuhan gula aren", price: 30 },
      { name: "Mami's Creamy Dalgona", desc: "kopi kocok ala Mami di atas susu dingin", price: 38 },
    ],
  },
  { title: "Thé & Mocktail", fr: "teh", items: [{ name: "Artisan Tea Selection", desc: "Chamomile · Earl Grey · Rose Berry, hot / cold", price: 32 }] },
  {
    title: "Pâtisserie",
    fr: "dine-in",
    items: [
      { name: "Mami's Classic Croissant", desc: "butter croissant, hangat dari oven", price: 28 },
      { name: "Signature Cheese Danish", desc: "", price: 32 },
      { name: "Traditional French Beignet", desc: "taburan gula halus", price: 25 },
      { name: "Pistachio & Almond Croissant", desc: "", price: 45 },
    ],
  },
  {
    title: "The Couple's Cupcake",
    fr: "collection",
    items: [
      { name: "Cupcake Duo", desc: "dua cupcake pilihan, untuk berdua", price: 55 },
      { name: "Cupcake Box · 6", desc: "varian menyusul", price: 150 },
    ],
  },
];

export const CAFE_FEATURED = [
  { name: "Pistachio Cream Cold Brew", tag: "signature", price: "Rp 42rb", img: "/images/cold-brew.jpg", ask: "Halo Mami I Patisserie, saya mau tanya Pistachio Cream Cold Brew untuk kafe nanti." },
  { name: "The Couple's Cupcake Duo", tag: "untuk berdua", price: "Rp 55rb", img: "/images/cupcake-1.jpg", ask: "Halo Mami I Patisserie, saya mau tanya The Couple's Cupcake Collection." },
  { name: "Pistachio & Almond Croissant", tag: "favorit Mami", price: "Rp 45rb", img: "/images/pistachio-croissant.jpg", ask: "Halo Mami I Patisserie, saya mau tanya Pistachio & Almond Croissant di kafe." },
];

/** Bar kopi board on the home page (prices not shown yet). */
export const DRINKS = [
  { name: "Pistachio Cream Cold Brew", desc: "Kopi seduh dingin + pistachio cream foam" },
  { name: "Artisan Tea Selection", desc: "Chamomile, Earl Grey, Rose Berry · hot / cold" },
  { name: "White Coffee Latte", desc: "" },
  { name: "Mami's Golden Rock Americano", desc: "" },
  { name: "Mami's Creamy Dalgona", desc: "" },
];
