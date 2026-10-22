// Public website catalog, taken from the design prototype (Web.dc.html).
// Stage 4 moves this into Supabase (products / campaigns) so Nana can edit it in the app (menu Konten).
//
// PRICES: every number here is a SAMPLE from the prototype ("harga contoh"), not a final price. Final prices
// are still pending from Alto. While PRICES_ARE_SAMPLE is true the menu shows "harga menyusul" (as in the
// prototype) and checkout labels totals as sample prices.

export const PRICES_ARE_SAMPLE = true;

export type ProductCategory = "pastry" | "frozen" | "hampers" | "natal";

export interface Product {
  id: string;
  name: string;
  desc: string;
  category: ProductCategory;
  /** Photo in /public, or null for a striped placeholder slot. */
  img: string | null;
  /** Description of the photo still to come (shown in the placeholder slot). */
  photoNote: string;
  /** SAMPLE price per item in Rupiah (see PRICES_ARE_SAMPLE). */
  price: number;
}

export const PRODUCTS: Product[] = [
  { id: "classic-croissant", name: "Mami's Classic Croissant", desc: "Croissant butter klasik, dipanggang setiap pagi.", category: "pastry", img: "/images/croissant.jpg", photoNote: "foto classic croissant", price: 28000 },
  { id: "cheese-danish", name: "Signature Cheese Danish", desc: "Danish renyah dengan isian keju.", category: "pastry", img: "/images/danish.jpg", photoNote: "foto cheese danish", price: 32000 },
  { id: "french-beignet", name: "Traditional French Beignet", desc: "Donat Prancis dengan taburan gula halus.", category: "pastry", img: "/images/beignet.jpg", photoNote: "foto beignet", price: 25000 },
  { id: "pistachio-almond-croissant", name: "Pistachio & Almond Croissant", desc: "Croissant isi pistachio cream & almond.", category: "pastry", img: "/images/pistachio-croissant.jpg", photoNote: "foto pistachio almond croissant", price: 58000 },
  { id: "heritage-risol", name: "Mami's Heritage Risol", desc: "Risol ragout ayam beku, isi 10. Tinggal goreng.", category: "frozen", img: "/images/risol-frozen.jpg", photoNote: "foto risol frozen dalam mika", price: 75000 },
  { id: "croquette", name: "Mami's Croquette", desc: "Kroket beku, tinggal goreng.", category: "frozen", img: "/images/kroket-frozen.jpg", photoNote: "foto kroket frozen", price: 70000 },
  { id: "signature-recipe", name: "Mami's Signature Recipe", desc: "Kue kering dari resep yang dikunci Mami selama 24 tahun, dalam box wine khas Mami I.", category: "hampers", img: "/images/hampers-kue-kering.jpg", photoNote: "foto box hampers kue kering", price: 185000 },
  { id: "blessings-box", name: "Mami's Blessings Box", desc: "Pastry, risol, kroket, dan dalgona.", category: "hampers", img: "/images/blessings-box.jpg", photoNote: "foto Blessings Box", price: 250000 },
  { id: "natal-mini", name: "Natal Mini", desc: "untuk satu rumah", category: "natal", img: "/images/hampers-kue-kering.jpg", photoNote: "foto paket Natal Mini", price: 165000 },
  { id: "natal-classic", name: "Natal Classic", desc: "untuk keluarga", category: "natal", img: "/images/hampers-kue-kering.jpg", photoNote: "foto paket Natal Classic", price: 245000 },
  { id: "natal-grande", name: "Natal Grande", desc: "untuk keluarga besar atau kantor kecil", category: "natal", img: "/images/hampers-kue-kering.jpg", photoNote: "foto paket Natal Grande", price: 385000 },
];

const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
export const productById = (id: string): Product | undefined => BY_ID.get(id);
export const productsIn = (category: ProductCategory) => PRODUCTS.filter((p) => p.category === category);

/** Hampers boxes on /hampers ("rangkai bingkisan"). */
export const HAMPERS_BOXES = [
  {
    productId: "blessings-box",
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
    productId: "signature-recipe",
    sub: "kue kering warisan",
    short: "3 toples kue kering resep 24 tahun.",
    items: [
      [3, "Toples kue kering resep Mami"],
      [1, "Box hampers wine + pita satin"],
    ],
  },
] as const satisfies readonly { productId: string; sub: string; short: string; items: readonly (readonly [number, string])[] }[];

/** Natal packages: jar count and how the shared photo is cropped per card. */
export const NATAL_PACKAGES = [
  { productId: "natal-mini", toples: 2, zoom: 1.9, origin: "20% 70%" },
  { productId: "natal-classic", toples: 3, zoom: 1.3, origin: "50% 65%" },
  { productId: "natal-grande", toples: 5, zoom: 1, origin: "50% 50%" },
] as const;

export const NATAL_PRODUCT_IDS: readonly string[] = NATAL_PACKAGES.map((p) => p.productId);
export const HAMPERS_PRODUCT_IDS: readonly string[] = [...productsIn("hampers"), ...productsIn("natal")].map((p) => p.id);

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
