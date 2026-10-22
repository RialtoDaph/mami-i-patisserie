import type { Metadata } from "next";
import { MenuPage } from "@/components/site/pages/MenuPage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { getSiteConfig } from "@/lib/site/config";

export const revalidate = 300;
export const metadata: Metadata = { title: "Menu", description: "Pastry, risol & kroket frozen, hampers, dan menu kafe Mami I." };

export default function Menu() {
  const config = getSiteConfig();
  return config.modeNatal ? <NatalPage config={config} scrollTo="paket" /> : <MenuPage />;
}
