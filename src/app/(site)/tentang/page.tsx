import type { Metadata } from "next";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { TentangPage } from "@/components/site/pages/TentangPage";
import { getSiteConfig } from "@/lib/site/config";

export const revalidate = 300;
export const metadata: Metadata = { title: "Tentang", description: "24 tahun resep keluarga di dapur Mami, kini untuk meja Anda." };

export default function Tentang() {
  const config = getSiteConfig();
  return config.modeNatal ? <NatalPage config={config} /> : <TentangPage />;
}
