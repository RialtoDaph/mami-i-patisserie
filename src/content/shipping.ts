// Delivery methods and flat fees per area from the prototype.
// PLACEHOLDER: these fees are SAMPLES ("tarif asli belum ada"); replace with Alto's real tariffs.

export type DeliveryMethod = "ambil" | "instan" | "ekspedisi";

export const SHIPPING_IS_SAMPLE = true;

export const DELIVERY_AREAS: Record<Exclude<DeliveryMethod, "ambil">, { area: string; fee: number }[]> = {
  instan: [
    { area: "Bandung Tengah", fee: 15000 },
    { area: "Bandung Utara", fee: 20000 },
    { area: "Bandung Timur & Selatan", fee: 25000 },
    { area: "Cimahi", fee: 30000 },
  ],
  ekspedisi: [
    { area: "Jawa Barat", fee: 35000 },
    { area: "Jabodetabek", fee: 45000 },
    { area: "Jawa Tengah & DIY", fee: 55000 },
    { area: "Jawa Timur", fee: 65000 },
  ],
};

export const PICKUP_SLOTS = ["10.00–12.00", "12.00–15.00", "15.00–17.00"] as const;
