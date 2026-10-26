import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Laporan kafe" };

export default function Page() {
  return <ComingSoon icon="storefront" stage="Tahap 5f" items={["Upload file export harian Majoo (xlsx, csv, PDF, foto)", "Total, transaksi, tunai, QRIS, kartu, ojol", "Centang \"dicek\" oleh Owner dan pengingat kalau laporan belum masuk"]} />;
}
