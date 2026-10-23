import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Target & Rencana" };

export default function Page() {
  return <ComingSoon icon="flag" stage="Tahap 5c" items={["Goals, target bulanan & tahunan dengan progres otomatis", "Milestone (otomatis telat kalau lewat tanggal) dan roadmap 12 bulan"]} />;
}
