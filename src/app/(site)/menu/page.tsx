import type { Metadata } from "next";
import { MenuPage } from "@/components/site/pages/MenuPage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { loadSiteData } from "@/lib/site/data";

export const revalidate = 300;
export const metadata: Metadata = { title: "Menu", description: "Pastry, risol & kroket frozen, hampers, dan menu kafe Mami I." };

export default async function Menu() {
  const data = await loadSiteData();
  return data.settings.modeNatal ? <NatalPage data={data} scrollTo="paket" /> : <MenuPage data={data} />;
}
