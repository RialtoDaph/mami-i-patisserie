import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/site/config";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };

export default function CartPage() {
  const c = getSiteConfig();
  return (
    <CheckoutView
      config={{ modeNatal: c.modeNatal, dpPercent: c.dpPercent, dpRound: c.dpRound, minLeadDays: c.minLeadDays, natalLeft: Math.max(0, c.natalQuota - c.natalUsed) }}
    />
  );
}
