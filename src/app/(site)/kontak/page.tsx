import type { Metadata } from "next";
import { KontakPage } from "@/components/site/pages/KontakPage";

export const metadata: Metadata = { title: "Kontak", description: "WhatsApp admin, alamat dapur untuk ambil sendiri, dan info pengiriman Mami I." };

export default function Kontak() {
  return <KontakPage />;
}
