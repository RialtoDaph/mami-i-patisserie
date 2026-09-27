import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { WebCategory } from "@/content/site";
import type {
  Campaign, Customer, FulfillMethod, Order, OrderStatus, Payment, PaymentMethod, Product, Settings,
} from "./preorder";

type Num = number | string;
const num = (v: Num) => Number(v);
const numOrNull = (v: Num | null) => (v == null ? null : Number(v));

interface ProductRow {
  id: string; name: string; description: string | null; recipe_id: string | null; bundle_id: string | null;
  units_per_product: Num; price: Num; show_on_website: boolean; preorder_enabled: boolean;
  weekly_capacity: number | null; min_lead_days: number; photo_path: string | null; is_active: boolean; is_dummy: boolean;
  web_category: WebCategory;
}
interface CampaignRow {
  id: string; name: string; preorder_open: string; preorder_close: string; fulfill_start: string | null;
  fulfill_end: string | null; dp_percent: Num | null; is_active: boolean; notes: string | null; is_dummy: boolean;
  campaign_products: { product_id: string; price_override: Num | null }[];
}
interface CustomerRow { id: string; name: string; whatsapp: string; address: string | null; notes: string | null; is_dummy: boolean; created_at: string }
interface OrderRow {
  id: string; order_no: string; customer_id: string; campaign_id: string | null; fulfill_date: string;
  fulfill_method: FulfillMethod; delivery_address: string | null; status: OrderStatus; subtotal: Num;
  shipping_fee: Num; discount: Num; total: Num; dp_amount: Num; amount_paid: Num; notes: string | null;
  created_at: string; is_dummy: boolean;
  order_items: { product_id: string; qty: number; unit_price: Num; sort_order: number }[];
}
interface PaymentRow { id: string; amount: Num; method: PaymentMethod; proof_path: string | null; paid_at: string; note: string | null }
interface SettingsRow {
  business_name: string; business_whatsapp: string | null; bank_name: string | null; bank_account_no: string | null;
  bank_account_name: string | null; qris_note: string | null; pickup_address: string | null; default_dp_percent: Num;
}

export interface ProductFull extends Product { isDummy: boolean; webCategory: WebCategory }
export interface CampaignFull extends Campaign { notes: string | null; isDummy: boolean }
export interface CustomerFull extends Customer { isDummy: boolean; createdAt: string }
export interface OrderFull extends Order { isDummy: boolean }

export const mapProduct = (r: ProductRow): ProductFull => ({
  id: r.id, name: r.name, description: r.description, recipeId: r.recipe_id, bundleId: r.bundle_id,
  unitsPerProduct: num(r.units_per_product), price: num(r.price), showOnWebsite: r.show_on_website,
  preorderEnabled: r.preorder_enabled, weeklyCapacity: r.weekly_capacity, minLeadDays: r.min_lead_days,
  photoPath: r.photo_path, isActive: r.is_active, isDummy: r.is_dummy, webCategory: r.web_category,
});

const mapCampaign = (r: CampaignRow): CampaignFull => ({
  id: r.id, name: r.name, preorderOpen: r.preorder_open, preorderClose: r.preorder_close,
  fulfillStart: r.fulfill_start, fulfillEnd: r.fulfill_end, dpPercent: numOrNull(r.dp_percent),
  isActive: r.is_active, notes: r.notes, isDummy: r.is_dummy,
  products: r.campaign_products.map((cp) => ({ productId: cp.product_id, priceOverride: numOrNull(cp.price_override) })),
});

const mapCustomer = (r: CustomerRow): CustomerFull => ({
  id: r.id, name: r.name, whatsapp: r.whatsapp, address: r.address, notes: r.notes, isDummy: r.is_dummy, createdAt: r.created_at,
});

const mapOrder = (r: OrderRow): OrderFull => ({
  id: r.id, orderNo: r.order_no, customerId: r.customer_id, campaignId: r.campaign_id, fulfillDate: r.fulfill_date,
  fulfillMethod: r.fulfill_method, deliveryAddress: r.delivery_address, status: r.status, subtotal: num(r.subtotal),
  shippingFee: num(r.shipping_fee), discount: num(r.discount), total: num(r.total), dpAmount: num(r.dp_amount),
  amountPaid: num(r.amount_paid), notes: r.notes, createdAt: r.created_at, isDummy: r.is_dummy,
  items: [...r.order_items].sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ productId: i.product_id, qty: i.qty, unitPrice: num(i.unit_price) })),
});

const mapSettings = (r: SettingsRow): Settings => ({
  businessName: r.business_name, businessWhatsapp: r.business_whatsapp, bankName: r.bank_name,
  bankAccountNo: r.bank_account_no, bankAccountName: r.bank_account_name, qrisNote: r.qris_note,
  pickupAddress: r.pickup_address, defaultDpPercent: num(r.default_dp_percent),
});

export interface PreorderData {
  products: ProductFull[];
  campaigns: CampaignFull[];
  customers: CustomerFull[];
  orders: OrderFull[];
  settings: Settings;
}

/** Everything the preorder pages need. Small enough to load whole for now. */
export const loadPreorderData = cache(async (): Promise<PreorderData> => {
  const supabase = await createClient();
  const [p, c, cu, o, s] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("campaigns").select("*, campaign_products(product_id, price_override)").order("preorder_open", { ascending: false }),
    supabase.from("customers").select("*").order("name"),
    supabase.from("orders").select("*, order_items(product_id, qty, unit_price, sort_order)").order("fulfill_date").order("order_no"),
    supabase.from("settings").select("*").maybeSingle(),
  ]);
  const error = p.error ?? c.error ?? cu.error ?? o.error ?? s.error;
  if (error) throw new Error(`Gagal memuat data preorder: ${error.message}`);
  return {
    products: (p.data as ProductRow[]).map(mapProduct),
    campaigns: (c.data as CampaignRow[]).map(mapCampaign),
    customers: (cu.data as CustomerRow[]).map(mapCustomer),
    orders: (o.data as OrderRow[]).map(mapOrder),
    settings: s.data ? mapSettings(s.data as SettingsRow) : mapSettings({
      business_name: "Mami I Pâtisserie", business_whatsapp: null, bank_name: null, bank_account_no: null,
      bank_account_name: null, qris_note: null, pickup_address: null, default_dp_percent: 50,
    }),
  };
});

export interface PaymentWithUrl extends Payment {
  proofUrl: string | null;
}

/** Payments of an order with short-lived signed URLs for the private proof photos. */
export async function loadPayments(orderId: string): Promise<PaymentWithUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments").select("id, amount, method, proof_path, paid_at, note")
    .eq("order_id", orderId).order("paid_at");
  if (error) throw new Error(`Gagal memuat pembayaran: ${error.message}`);
  const rows = data as PaymentRow[];
  const paths = rows.map((r) => r.proof_path).filter((x): x is string => !!x);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabase.storage.from("payment-proofs").createSignedUrls(paths, 60 * 30);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }
  return rows.map((r) => ({
    id: r.id, amount: num(r.amount), method: r.method, proofPath: r.proof_path, paidAt: r.paid_at, note: r.note,
    proofUrl: r.proof_path ? signed.get(r.proof_path) ?? null : null,
  }));
}

/** Public URL of a product photo (bucket is public). */
export function productPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-photos/${path}`;
}
