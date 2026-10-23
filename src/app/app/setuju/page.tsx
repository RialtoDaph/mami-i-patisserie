import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Persetujuan" };

export default function Page() {
  return <ComingSoon icon="approval" stage="Tahap 5c" items={["Pengajuan alat, campaign, harga, lain-lain", "Batas: alat > Rp 2.000.000, campaign > Rp 1.000.000 perlu persetujuan Alto"]} />;
}
