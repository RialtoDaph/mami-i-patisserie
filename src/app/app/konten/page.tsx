import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Konten" };

export default function Page() {
  return <ComingSoon icon="calendar_month" stage="Tahap 5h" items={["Ubah teks website (hero, FAQ, kontak) tanpa developer", "Jadwal posting per campaign"]} />;
}
