// Domain types for the preorder module. Dates are ISO "YYYY-MM-DD" strings (Asia/Jakarta),
// money is whole Rupiah.

export type FulfillMethod = "ambil" | "kirim_instan" | "ekspedisi";
export type OrderStatus =
  | "baru"
  | "menunggu_dp"
  | "dp_diterima"
  | "diproduksi"
  | "siap"
  | "dikirim"
  | "selesai"
  | "batal";
export type PaymentMethod = "transfer" | "qris" | "tunai";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  recipeId: string | null;
  bundleId: string | null;
  unitsPerProduct: number;
  price: number;
  showOnWebsite: boolean;
  preorderEnabled: boolean;
  /** Max quantity per Mon–Sun week of the fulfill date; null = unlimited. */
  weeklyCapacity: number | null;
  minLeadDays: number;
  photoPath: string | null;
  isActive: boolean;
}

export interface CampaignProduct {
  productId: string;
  priceOverride: number | null;
}

export interface Campaign {
  id: string;
  name: string;
  preorderOpen: string;
  preorderClose: string;
  fulfillStart: string | null;
  fulfillEnd: string | null;
  /** Null = use the global default. */
  dpPercent: number | null;
  isActive: boolean;
  products: CampaignProduct[];
}

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  address: string | null;
  notes: string | null;
}

export interface OrderItem {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  proofPath: string | null;
  paidAt: string;
  note: string | null;
}

export interface Order {
  id: string;
  orderNo: string;
  customerId: string;
  campaignId: string | null;
  fulfillDate: string;
  fulfillMethod: FulfillMethod;
  deliveryAddress: string | null;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  dpAmount: number;
  amountPaid: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface Settings {
  businessName: string;
  businessWhatsapp: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  qrisNote: string | null;
  pickupAddress: string | null;
  defaultDpPercent: number;
}
