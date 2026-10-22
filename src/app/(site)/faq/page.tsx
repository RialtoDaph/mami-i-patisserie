import type { Metadata } from "next";
import { FaqPage } from "@/components/site/pages/FaqPage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { getSiteConfig } from "@/lib/site/config";

export const revalidate = 300;
export const metadata: Metadata = { title: "FAQ", description: "Pertanyaan yang sering ditanya: pemesanan, pembayaran DP, pengiriman, dan hampers." };

export default function Faq() {
  const config = getSiteConfig();
  return config.modeNatal ? <NatalPage config={config} scrollTo="tanya" /> : <FaqPage />;
}
