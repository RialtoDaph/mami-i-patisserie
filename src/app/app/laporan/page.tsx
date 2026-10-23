import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Laporan" };

export default function Page() {
  return <ComingSoon icon="monitoring" stage="Tahap 5g" items={["Omzet kafe vs pre-order vs target", "Pola hari/jam, produk & food cost, pelanggan, campaign, pembayaran"]} />;
}
