import type { Metadata } from "next";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { TentangPage } from "@/components/site/pages/TentangPage";
import { loadSiteData } from "@/lib/site/data";

export const revalidate = 300;
export const metadata: Metadata = { title: "Tentang", description: "24 tahun resep keluarga di dapur Mami, kini untuk meja Anda." };

export default async function Tentang() {
  const data = await loadSiteData();
  return data.settings.modeNatal ? <NatalPage data={data} /> : <TentangPage />;
}
