import type { Metadata } from "next";
import { site } from "@/content/site";
import { CartProvider } from "@/components/site/CartProvider";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter, SiteOverlays } from "@/components/site/SiteOverlays";
import { SiteMotion } from "@/components/site/SiteMotion";
import { getSiteConfig } from "@/lib/site/config";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { modeNatal, snow } = getSiteConfig();
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-brand-butter-50 font-body text-brand-espresso">
      <CartProvider>
        <SiteHeader modeNatal={modeNatal} />
        <main>{children}</main>
        <SiteFooter modeNatal={modeNatal} />
        <SiteOverlays modeNatal={modeNatal} />
        <SiteMotion snow={snow} />
      </CartProvider>
    </div>
  );
}
