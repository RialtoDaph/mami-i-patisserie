import { HomePage } from "@/components/site/pages/HomePage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { loadSiteData } from "@/lib/site/data";

// Countdowns ("N hari lagi") are computed at render; refresh regularly.
export const revalidate = 300;

export default async function Beranda() {
  const data = await loadSiteData();
  return data.settings.modeNatal ? <NatalPage data={data} /> : <HomePage data={data} />;
}
