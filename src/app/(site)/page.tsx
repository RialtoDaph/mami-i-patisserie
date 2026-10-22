import { HomePage } from "@/components/site/pages/HomePage";
import { NatalPage } from "@/components/site/pages/NatalPage";
import { getSiteConfig } from "@/lib/site/config";

// Countdowns ("N hari lagi") are computed at render; refresh regularly.
export const revalidate = 300;

export default function Beranda() {
  const config = getSiteConfig();
  return config.modeNatal ? <NatalPage config={config} /> : <HomePage />;
}
