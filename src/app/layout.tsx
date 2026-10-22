import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Brand fonts (final, design handoff round 4): Libre Baskerville headings, Instrument Sans text/UI,
// Kalam for small handwritten labels. Self-hosted from @fontsource so builds need no network.
const serif = localFont({
  src: [
    { path: "../../node_modules/@fontsource/libre-baskerville/files/libre-baskerville-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/libre-baskerville/files/libre-baskerville-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-brand-serif",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "../../node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-brand-sans",
  display: "swap",
});

const script = localFont({
  src: "../../node_modules/@fontsource/kalam/files/kalam-latin-400-normal.woff2",
  weight: "400",
  variable: "--font-brand-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Mami I Pâtisserie", template: "%s · Mami I Pâtisserie" },
  description: "Bakery cafe di Bandung.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3e2723",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${serif.variable} ${sans.variable} ${script.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
