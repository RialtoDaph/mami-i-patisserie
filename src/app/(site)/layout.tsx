import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/content/site";
import { CartProvider } from "@/components/site/CartProvider";
import { CartBar } from "@/components/site/CartBar";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

// EB Garamond: the packaged Cormorant Garamond renders the circumflex in "Pâtisserie" misplaced.
const serif = localFont({
  src: [
    { path: "../../../node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-500-normal.woff2", weight: "500" },
    { path: "../../../node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-600-normal.woff2", weight: "600" },
    { path: "../../../node_modules/@fontsource/eb-garamond/files/eb-garamond-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-brand-serif",
  display: "swap",
});

const sans = localFont({
  src: "../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-brand-sans",
  display: "swap",
});

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
    <div className={`${serif.variable} ${sans.variable} min-h-dvh bg-brand-cream font-body text-brand-oak-dark`}>
      <CartProvider>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <CartBar />
      </CartProvider>
    </div>
  );
}
