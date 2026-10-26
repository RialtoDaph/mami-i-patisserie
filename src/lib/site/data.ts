import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { site } from "@/content/site";
import type { DeliveryMethod } from "@/content/shipping";
import type { SnowMode } from "./config";
import type { WebProduct } from "./types";

// Public website data, read through the anon-safe RPCs (migration 20261022000001). Never throws: when Supabase
// is unreachable the site still renders (empty catalog, orders closed).

export interface WebCampaign {
  id: string;
  slug: string | null;
  name: string;
  preorderOpen: string;
  preorderClose: string;
  fulfillStart: string | null;
  fulfillEnd: string | null;
  quota: number | null;
  used: number;
  isOpen: boolean;
  products: { productId: string; price: number }[];
}

export interface WebSettings {
  dpPercent: number;
  dpRound: number;
  minLeadDays: number;
  payTimeoutMin: number;
  modeNatal: boolean;
  snow: SnowMode;
  ordersOpen: boolean;
  shippingIsSample: boolean;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  qrisUrl: string | null;
}

export interface WebShippingArea {
  method: Exclude<DeliveryMethod, "ambil">;
  area: string;
  fee: number;
}

export interface SiteData {
  ok: boolean;
  settings: WebSettings;
  products: WebProduct[];
  campaigns: WebCampaign[];
  shipping: WebShippingArea[];
}

const FALLBACK_SETTINGS: WebSettings = {
  dpPercent: 40,
  dpRound: 50_000,
  minLeadDays: 2,
  payTimeoutMin: 60,
  modeNatal: false,
  snow: "mati",
  ordersOpen: false,
  shippingIsSample: true,
  bankName: null,
  bankAccountNo: null,
  bankAccountName: null,
  qrisUrl: null,
};

export function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Site path ("/images/…") as is; otherwise a public URL in the product-photos bucket. */
export function photoUrl(path: string | null, bucket = "product-photos"): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${bucket}/${path}` : null;
}

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);
const str = (v: unknown) => (v == null ? null : String(v));

export const loadSiteData = cache(async (): Promise<SiteData> => {
  const sb = anonClient();
  const empty: SiteData = { ok: false, settings: FALLBACK_SETTINGS, products: [], campaigns: [], shipping: [] };
  if (!sb) return empty;
  const dummy = { p_include_dummy: site.showDummy };
  try {
    const [s, p, c, a] = await Promise.all([
      sb.rpc("public_settings"),
      sb.rpc("public_catalog", dummy),
      sb.rpc("public_campaigns", dummy),
      sb.rpc("public_shipping_areas", dummy),
    ]);
    const err = s.error ?? p.error ?? c.error ?? a.error;
    if (err) throw err;

    const st = ((s.data as Row[]) ?? [])[0] ?? {};
    const settings: WebSettings = {
      dpPercent: num(st.dp_percent ?? 40),
      dpRound: num(st.dp_round ?? 50_000),
      minLeadDays: num(st.min_lead_days ?? 2),
      payTimeoutMin: num(st.pay_timeout_min ?? 60),
      modeNatal: Boolean(st.mode_natal),
      snow: (["hero", "semua", "mati"].includes(String(st.snow_mode)) ? st.snow_mode : "mati") as SnowMode,
      ordersOpen: Boolean(st.web_orders_open),
      shippingIsSample: st.shipping_is_sample !== false,
      bankName: str(st.bank_name),
      bankAccountNo: str(st.bank_account_no),
      bankAccountName: str(st.bank_account_name),
      qrisUrl: photoUrl(str(st.qris_path)),
    };

    const campaigns: WebCampaign[] = ((c.data as Row[]) ?? []).map((r) => ({
      id: String(r.id),
      slug: str(r.slug),
      name: String(r.name),
      preorderOpen: String(r.preorder_open),
      preorderClose: String(r.preorder_close),
      fulfillStart: str(r.fulfill_start),
      fulfillEnd: str(r.fulfill_end),
      quota: r.quota == null ? null : num(r.quota),
      used: num(r.used),
      isOpen: Boolean(r.is_open),
      products: ((r.products as Row[]) ?? []).map((x) => ({ productId: String(x.product_id), price: num(x.price) })),
    }));

    // Products sold in an open campaign use the campaign price.
    const campaignPrice = new Map<string, number>();
    for (const cp of campaigns.filter((x) => x.isOpen)) for (const x of cp.products) campaignPrice.set(x.productId, x.price);

    const products: WebProduct[] = ((p.data as Row[]) ?? []).map((r) => {
      const id = String(r.id);
      const inCampaign = campaignPrice.has(id);
      return {
        id,
        slug: str(r.slug),
        name: String(r.name),
        desc: String(r.description ?? ""),
        category: String(r.web_category),
        price: campaignPrice.get(id) ?? num(r.price),
        pricePending: Boolean(r.price_pending),
        // As in the design: pending prices read "harga menyusul", except campaign packages (shown with a sample note).
        showPrice: !r.price_pending || inCampaign,
        img: photoUrl(str(r.photo_path)),
        photoNote: String(r.photo_note ?? r.name),
        minLeadDays: num(r.min_lead_days),
      };
    });

    const shipping: WebShippingArea[] = ((a.data as Row[]) ?? []).map((r) => ({
      method: r.method as WebShippingArea["method"],
      area: String(r.area),
      fee: num(r.fee),
    }));

    return { ok: true, settings, products, campaigns, shipping };
  } catch (e) {
    console.error("loadSiteData failed", e);
    return empty;
  }
});

export const bySlug = (products: WebProduct[], slug: string) => products.find((p) => p.slug === slug);
export const campaignBySlug = (campaigns: WebCampaign[], slug: string) => campaigns.find((c) => c.slug === slug);
