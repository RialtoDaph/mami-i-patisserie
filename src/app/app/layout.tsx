import { AppShell, type ShellProps } from "@/components/app/AppShell";
import { getCurrentUser } from "@/lib/data";
import { signOut } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions";
import { greetLine, tabsForRole } from "@/lib/appNav";
import { todayJakarta } from "@/lib/preorder";
import { Icon } from "@/components/brand";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user.role) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-brand-butter-100 px-4">
        <div className="flex max-w-md flex-col gap-3 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 p-6 text-center text-brand-espresso">
          <h1 className="font-display text-xl font-bold">Akun belum diberi akses</h1>
          <p className="text-brand-muted">
            Akun <b>{user.fullName || user.email}</b> sudah terdaftar, tapi belum punya peran atau sedang dinonaktifkan. Minta Alto
            untuk mengatur akses Anda.
          </p>
          <form action={signOut}>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-wine">
              <Icon name="logout" size={20} /> Keluar
            </button>
          </form>
        </div>
      </main>
    );
  }

  const tabs = tabsForRole(user.role);
  const today = todayJakarta();
  let next: { name: string; endIso: string } | null = null;
  if (tabs.includes("beranda")) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("campaigns")
      .select("name, fulfill_end")
      .gte("fulfill_end", today)
      .not("fulfill_end", "is", null)
      .order("fulfill_end")
      .limit(1)
      .maybeSingle();
    if (data?.fulfill_end) next = { name: data.name, endIso: data.fulfill_end };
  }

  const extras: ShellProps["extras"] = [];
  if (tabs.includes("lainnya")) {
    extras.push(
      { label: "Pelanggan", href: "/app/pelanggan", icon: "group", group: "Lainnya" },
      { label: "Produk", href: "/app/produk", icon: "bakery_dining", group: "Lainnya" },
      { label: "Campaign", href: "/app/campaign", icon: "campaign", group: "Lainnya" },
      { label: "Pengaturan", href: "/app/pengaturan", icon: "settings", group: "Lainnya" },
    );
  }
  if (tabs.includes("costing")) {
    extras.push(
      { label: "Bahan", href: "/app/bahan", icon: "calculate", group: "Costing" },
      { label: "Resep", href: "/app/resep", icon: "menu_book", group: "Costing" },
      { label: "Paket", href: "/app/paket", icon: "redeem", group: "Costing" },
    );
  }
  if (can(user.role, "team.manage")) extras.push({ label: "Akun tim", href: "/app/lainnya/akun", icon: "manage_accounts", group: "Lainnya" });

  const name = user.fullName || user.email || "";
  return (
    <AppShell
      tabs={tabs}
      userLabel={user.title ? `${name} · ${user.title}` : name}
      greeting={`Halo${user.fullName ? `, ${user.fullName}` : ""}!`}
      headSub={greetLine(today, next)}
      canOrder={can(user.role, "order.edit")}
      extras={extras}
      signOut={signOut}
    >
      {children}
    </AppShell>
  );
}
