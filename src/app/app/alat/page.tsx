import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Alat & perawatan" };

export default function Page() {
  return <ComingSoon icon="handyman" stage="Tahap 5h" items={["Inventaris alat, jadwal perawatan", "Lapor kerusakan + foto, status perbaikan, alat \"akan ada\""]} />;
}
