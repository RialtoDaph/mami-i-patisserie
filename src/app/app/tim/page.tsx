import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Tim" };

export default function Page() {
  return <ComingSoon icon="badge" stage="Tahap 5d–5e" items={["Jadwal shift 7 hari, absen masuk/pulang, izin", "Gaji, lembur, insentif dan slip gaji"]} />;
}
