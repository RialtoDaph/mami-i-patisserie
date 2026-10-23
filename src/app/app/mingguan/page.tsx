import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Laporan mingguan" };

export default function Page() {
  return <ComingSoon icon="summarize" stage="Tahap 5f" items={["Ringkasan 7 hari dari laporan kafe", "Catatan minggu ini dari Manager untuk Owner"]} />;
}
