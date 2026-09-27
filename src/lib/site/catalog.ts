import "server-only";
import { createClient } from "@supabase/supabase-js";
import { site, type WebCategory } from "@/content/site";

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  category: WebCategory;
  price: number;
  photoUrl: string | null;
  minLeadDays: number;
  fullThisWeek: boolean;
}

export interface PublicCampaign {
  id: string;
  name: string;
  preorderOpen: string;
  preorderClose: string;
  fulfillStart: string | null;
  fulfillEnd: string | null;
  isOpen: boolean;
  products: { productId: string; price: number }[];
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function publicPhotoUrl(path: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return path && base ? `${base}/storage/v1/object/public/product-photos/${path}` : null;
}

/** Website catalog via the anon-safe RPC. Returns [] if Supabase is unreachable (site still renders). */
export async function loadCatalog(): Promise<PublicProduct[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("public_catalog", { p_include_dummy: site.showDummy });
  if (error || !data) {
    console.error("public_catalog failed", error?.message);
    return [];
  }
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: String(r.name).replace(/^\[DUMMY\]\s*/, ""),
    description: (r.description as string | null) ?? null,
    category: r.web_category as WebCategory,
    price: Number(r.price),
    photoUrl: publicPhotoUrl((r.photo_path as string | null) ?? null),
    minLeadDays: Number(r.min_lead_days),
    fullThisWeek: Boolean(r.full_this_week),
  }));
}

export async function loadCampaigns(): Promise<PublicCampaign[]> {
  const supabase = client();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("public_campaigns", { p_include_dummy: site.showDummy });
  if (error || !data) {
    console.error("public_campaigns failed", error?.message);
    return [];
  }
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: String(r.name).replace(/^\[DUMMY\]\s*/, ""),
    preorderOpen: String(r.preorder_open),
    preorderClose: String(r.preorder_close),
    fulfillStart: (r.fulfill_start as string | null) ?? null,
    fulfillEnd: (r.fulfill_end as string | null) ?? null,
    isOpen: Boolean(r.is_open),
    products: ((r.products as { product_id: string; price: number }[]) ?? []).map((p) => ({ productId: p.product_id, price: Number(p.price) })),
  }));
}
