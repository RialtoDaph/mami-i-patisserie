import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/ComingSoon";

export const metadata: Metadata = { title: "Legal & izin" };

export default function Page() {
  return <ComingSoon icon="gavel" stage="Tahap 5h" items={["NIB, PIRT, halal, sewa dengan pengingat", "Teks kebijakan privasi, S&K pesan, alergen"]} />;
}
