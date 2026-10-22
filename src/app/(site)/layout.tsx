import type { Metadata } from "next";
import { site } from "@/content/site";
import { CartProvider } from "@/components/site/CartProvider";
import { CartBar } from "@/components/site/CartBar";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

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
  return (
    <div className={`min-h-dvh bg-brand-cream font-body text-brand-espresso`}>
      <CartProvider>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <CartBar />
      </CartProvider>
    </div>
  );
}
