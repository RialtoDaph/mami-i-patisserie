// Public website copy & contact info. Anything marked PLACEHOLDER must be confirmed by Alto/Nana.

export const site = {
  name: "Mami I Pâtisserie",
  city: "Bandung",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  /** Instagram handle without "@". */
  instagram: (process.env.NEXT_PUBLIC_INSTAGRAM || "").replace(/^@/, ""),
  showDummy: process.env.NEXT_PUBLIC_SHOW_DUMMY === "1",

  title: "Mami I Pâtisserie — Kue & Pastry Rumahan di Bandung",
  description:
    "Kue kering, risol & kroket frozen, kue basah, dan hampers dari resep warisan Mami selama 24 tahun. Pesan online via WhatsApp, Bandung.",

  hero: {
    // PLACEHOLDER copy (Nana)
    eyebrow: "Bandung · sejak dapur Mami",
    title: "Kue rumahan, sentuhan Paris.",
    subtitle: "Resep warisan Mami selama 24 tahun, dibuat dengan sabar untuk meja keluarga Anda.",
  },

  story: {
    // PLACEHOLDER copy (Nana): only the "24 tahun" fact is confirmed.
    title: "Dari dapur Mami",
    paragraphs: [
      "Selama 24 tahun, resep-resep di dapur Mami hanya dinikmati keluarga dan sahabat: kue kering di setiap hari raya, risol untuk arisan, kue basah untuk sore hari.",
      "Kini resep warisan itu kami bagikan lebih luas, dengan bahan yang dipilih teliti dan sentuhan pâtisserie ala Paris, tanpa kehilangan rasa rumahnya.",
    ],
    stat: { value: "24", label: "tahun resep warisan" },
  },

  timeline: "Pesan online mulai Januari 2027 · Kafe kami buka Oktober 2027",

  // PLACEHOLDER (Alto): confirm delivery areas & couriers.
  delivery: [
    { title: "Kota Bandung & sekitarnya", text: "Dikirim dengan kurir instan. Ongkir sesuai jarak, dikonfirmasi admin." },
    { title: "Luar kota", text: "Untuk kue kering dan hampers yang tahan lama, dikirim via ekspedisi." },
    { title: "Ambil sendiri", text: "Alamat pengambilan diinformasikan via WhatsApp setelah order dikonfirmasi." },
  ],

  orderSteps: [
    "Pilih produk dan masukkan ke keranjang.",
    "Tekan “Pesan via WhatsApp”, pesan berisi daftar pesanan akan terisi otomatis.",
    "Admin mengonfirmasi harga, ongkir, dan tanggal. DP untuk mengunci pesanan.",
  ],
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
