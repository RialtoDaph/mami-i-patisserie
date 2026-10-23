import type { Metadata } from "next";
import { HampersPage } from "@/components/site/pages/HampersPage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { loadSiteData } from "@/lib/site/data";

export const revalidate = 300;
export const metadata: Metadata = { title: "Hampers", description: "Hampers kue kering & Blessings Box dengan kartu ucapan yang ditulis tangan oleh Mami." };

export default async function Hampers() {
  const data = await loadSiteData();
  return data.settings.modeNatal ? <NatalPage data={data} scrollTo="paket" /> : <HampersPage data={data} />;
}
