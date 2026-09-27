import type { FulfillMethod, OrderStatus, PaymentMethod } from "./types";

export const ORDER_STATUSES: OrderStatus[] = [
  "baru", "menunggu_dp", "dp_diterima", "diproduksi", "siap", "dikirim", "selesai", "batal",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  baru: "Baru",
  menunggu_dp: "Menunggu DP",
  dp_diterima: "DP diterima",
  diproduksi: "Diproduksi",
  siap: "Siap",
  dikirim: "Dikirim",
  selesai: "Selesai",
  batal: "Batal",
};

export const FULFILL_LABEL: Record<FulfillMethod, string> = {
  ambil: "Ambil sendiri",
  kirim_instan: "Kirim instan",
  ekspedisi: "Ekspedisi",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  transfer: "Transfer",
  qris: "QRIS",
  tunai: "Tunai",
};

/** The usual next step, shown as the big primary button. Null when finished. */
export function nextStatus(status: OrderStatus, method: FulfillMethod): OrderStatus | null {
  switch (status) {
    case "baru":
      return "menunggu_dp";
    case "menunggu_dp":
      return "dp_diterima";
    case "dp_diterima":
      return "diproduksi";
    case "diproduksi":
      return "siap";
    case "siap":
      return method === "ambil" ? "selesai" : "dikirim";
    case "dikirim":
      return "selesai";
    default:
      return null;
  }
}

export function isOpen(status: OrderStatus): boolean {
  return status !== "selesai" && status !== "batal";
}
