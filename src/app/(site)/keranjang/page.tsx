import type { Metadata } from "next";
import { NATAL_SLUG } from "@/content/catalog";
import { campaignBySlug, loadSiteData } from "@/lib/site/data";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };
export const revalidate = 60;

export default async function CartPage() {
  const data = await loadSiteData();
  const c = data.settings.modeNatal ? campaignBySlug(data.campaigns, NATAL_SLUG) : undefined;
  const natal =
    c && c.fulfillStart && c.fulfillEnd
      ? { productIds: c.products.map((p) => p.productId), left: c.quota == null ? 9999 : Math.max(0, c.quota - c.used), from: c.fulfillStart, to: c.fulfillEnd }
      : null;
  return <CheckoutView config={{ settings: data.settings, shipping: data.shipping, natal }} />;
}
