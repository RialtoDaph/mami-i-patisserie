// Delivery methods (= orders.fulfill_method). Areas and flat fees live in the shipping_areas table.

export type DeliveryMethod = "ambil" | "kirim_instan" | "ekspedisi";

export const PICKUP_SLOTS = ["10.00–12.00", "12.00–15.00", "15.00–17.00"] as const;
