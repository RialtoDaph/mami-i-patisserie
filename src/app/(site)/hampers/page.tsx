import type { Metadata } from "next";
import { HampersPage } from "@/components/site/pages/HampersPage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { getSiteConfig } from "@/lib/site/config";

export const revalidate = 300;
export const metadata: Metadata = { title: "Hampers", description: "Hampers kue kering & Blessings Box dengan kartu ucapan yang ditulis tangan oleh Mami." };

export default function Hampers() {
  const config = getSiteConfig();
  return config.modeNatal ? <NatalPage config={config} scrollTo="paket" /> : <HampersPage />;
}
