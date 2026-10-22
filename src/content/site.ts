// Public website copy & contact info. Anything marked PLACEHOLDER must be confirmed by Alto/Nana.

export const site = {
  name: "Mami I Pâtisserie",
  city: "Bandung",
  // Explicit URL, else Vercel's production domain (system env, server-side), else local dev.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  /** Instagram handle without "@". */
  instagram: (process.env.NEXT_PUBLIC_INSTAGRAM || "").replace(/^@/, ""),
  showDummy: process.env.NEXT_PUBLIC_SHOW_DUMMY === "1",

  title: "Mami I Pâtisserie — Pastry & Hampers dari Dapur Mami, Bandung",
  description:
    "Pastry, risol & kroket frozen, kue kering, dan hampers dari resep keluarga Mami selama 24 tahun. Pesan online, Bandung.",

  // PLACEHOLDER contact details from the prototype ("masih contoh, belum final"). Confirm with Alto.
  contact: {
    whatsappDisplay: "0812-0000-0000", // shown only as a label; the real link uses NEXT_PUBLIC_WHATSAPP_NUMBER
    whatsappHours: "Setiap hari · 09.00–18.00",
    email: "halo@mamii.id",
    address: "Jl. Progo No. 8, Bandung",
    pickupHours: "Senin–Sabtu · 10.00–17.00",
  },

  // PLACEHOLDER (Alto): bank account & QRIS image are still pending. null = "menyusul".
  payment: {
    bank: "BCA",
    accountNumber: null as string | null,
    accountName: "Mami I Patisserie",
    qrisImage: null as string | null,
  },

  timeline: "Pesan online mulai Januari 2027 · Kafe kami buka Oktober 2027",
};

export const WEB_CATEGORIES = ["kue_kering", "frozen", "kue_basah", "pastry", "minuman", "hampers"] as const;
export type WebCategory = (typeof WEB_CATEGORIES)[number];

export const WEB_CATEGORY_LABEL: Record<WebCategory, string> = {
  kue_kering: "Kue Kering",
  frozen: "Frozen · Risol & Kroket",
  kue_basah: "Kue Basah",
  pastry: "Pastry",
  minuman: "Minuman",
  hampers: "Hampers",
};

export function instagramUrl(handle: string): string | null {
  return handle ? `https://instagram.com/${handle}` : null;
}
