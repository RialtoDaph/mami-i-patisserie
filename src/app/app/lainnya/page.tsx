import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { signOut } from "@/lib/actions";
import { can } from "@/lib/permissions";
import { TABS, tabsForRole, type TabKey } from "@/lib/appNav";
import { Icon, type IconName } from "@/components/brand";

export const metadata: Metadata = { title: "Lainnya" };

interface Row {
  href: string;
  icon: IconName;
  label: string;
  sub: string;
  /** Only on phones, where the bottom nav has no room for these tabs. */
  phoneOnly?: boolean;
}

const tabRow = (t: TabKey, phoneOnly = false): Row => ({ href: TABS[t].href, icon: TABS[t].icon, label: TABS[t].title, sub: TABS[t].sub ?? "", phoneOnly });

export default async function MorePage() {
  const user = await getCurrentUser();
  const tabs = tabsForRole(user.role);
  const rows: Row[] = [
    ...(["kafe", "costing", "alat", "setuju"] as TabKey[]).filter((t) => tabs.includes(t)).map((t) => tabRow(t, true)),
    ...(["target", "tim", "mingguan", "legal", "konten"] as TabKey[]).filter((t) => tabs.includes(t)).map((t) => tabRow(t)),
    { href: "/app/pelanggan", icon: "group", label: "Pelanggan", sub: "Data & riwayat order pelanggan" },
    { href: "/app/produk", icon: "bakery_dining", label: "Produk", sub: "Harga jual, kapasitas, status jual" },
    { href: "/app/campaign", icon: "campaign", label: "Campaign", sub: "Periode preorder, mis. Lebaran 2027" },
    { href: "/app/pengaturan", icon: "settings", label: "Pengaturan", sub: "Rekening, QRIS, alamat ambil, DP" },
  ];
  if (can(user.role, "team.manage")) rows.push({ href: "/app/lainnya/akun", icon: "manage_accounts", label: "Akun tim", sub: "Akses, PIN & perangkat tiap orang" });

  return (
    <div className="flex max-w-[640px] flex-col gap-3">
      <span className="text-sm text-brand-muted">
        Masuk sebagai <b className="text-brand-espresso">{user.fullName || user.email}{user.title && ` · ${user.title}`}</b>
      </span>
      <div className="overflow-hidden rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50">
        {rows.map((r, i) => (
          <Link
            key={r.href}
            href={r.href}
            className={`flex min-h-16 items-center gap-3.5 px-4 hover:bg-brand-butter ${i ? "border-t border-brand-espresso/10" : ""} ${r.phoneOnly ? "nav:hidden" : ""}`}
          >
            <Icon name={r.icon} size={24} className="text-brand-wine" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{r.label}</span>
              <span className="block text-[13px] text-brand-muted">{r.sub}</span>
            </span>
            <Icon name="chevron_right" size={22} className="text-brand-muted" />
          </Link>
        ))}
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="flex min-h-[54px] w-full items-center gap-2.5 rounded-md border-[1.5px] border-brand-wine/40 px-4 text-[15px] font-bold text-brand-wine"
        >
          <Icon name="logout" size={22} /> Keluar
        </button>
      </form>
    </div>
  );
}
