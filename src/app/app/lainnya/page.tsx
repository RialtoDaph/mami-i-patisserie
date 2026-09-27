import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { signOut } from "@/lib/actions";
import { ROLE_LABEL } from "@/lib/labels";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Lainnya" };

const LINKS = [
  { href: "/app/pelanggan", icon: "👥", label: "Pelanggan", desc: "Data & riwayat order pelanggan" },
  { href: "/app/produk", icon: "🥐", label: "Produk", desc: "Harga jual, kapasitas, foto" },
  { href: "/app/campaign", icon: "🌙", label: "Campaign", desc: "Periode preorder, mis. Lebaran 2027" },
  { href: "/app/pengaturan", icon: "⚙️", label: "Pengaturan", desc: "Rekening, QRIS, alamat ambil, DP" },
];

export default async function MorePage() {
  const user = await getCurrentUser();
  return (
    <>
      <PageHeader title="Lainnya" />
      <p className="-mt-2 mb-4 text-sm text-muted">
        Masuk sebagai {user.fullName || user.email}{user.role && ` · ${ROLE_LABEL[user.role]}`}
      </p>
      <ul className="flex flex-col gap-2">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="card flex items-center gap-3">
              <span aria-hidden className="text-2xl">{l.icon}</span>
              <span>
                <b>{l.label}</b>
                <span className="block text-sm text-muted">{l.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <form action={signOut} className="mt-6">
        <button type="submit" className="btn-secondary w-full">Keluar</button>
      </form>
    </>
  );
}
