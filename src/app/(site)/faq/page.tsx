import type { Metadata } from "next";
import { FaqPage } from "@/components/site/pages/FaqPage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { loadSiteData } from "@/lib/site/data";

export const revalidate = 300;
export const metadata: Metadata = { title: "FAQ", description: "Pertanyaan yang sering ditanya: pemesanan, pembayaran DP, pengiriman, dan hampers." };

export default async function Faq() {
  const data = await loadSiteData();
  return data.settings.modeNatal ? <NatalPage data={data} scrollTo="tanya" /> : <FaqPage />;
}
