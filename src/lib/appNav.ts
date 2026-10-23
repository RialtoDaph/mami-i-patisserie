// Internal app navigation: 6 groups, tabs per role (APP.md + prototype "App Internal v2").
// Pure, shared by the server layout (route guard) and the client shell (nav, pill tabs, Ctrl K).
import type { IconName } from "@/components/brand/icons.generated";
import type { AppRole } from "./permissions";

export type TabKey =
  | "beranda" | "order" | "produksi" | "kafe" | "mingguan" | "laporan" | "costing" | "target"
  | "tim" | "setuju" | "lainnya" | "alat" | "legal" | "konten";

export interface TabDef {
  label: string;
  title: string;
  icon: IconName;
  href: string;
  /** Extra path prefixes that belong to this tab. */
  paths?: string[];
  /** Line shown in the Lainnya list. */
  sub?: string;
  /** Extra words for the Ctrl K menu search. */
  keywords?: string;
}

export const TABS: Record<TabKey, TabDef> = {
  beranda: { label: "Beranda", title: "Beranda", icon: "home", href: "/app", keywords: "dashboard ringkasan" },
  order: { label: "Order", title: "Order", icon: "receipt_long", href: "/app/order", keywords: "pesanan dp bukti bayar pelanggan" },
  produksi: { label: "Produksi", title: "Produksi", icon: "skillet", href: "/app/produksi", keywords: "jadwal belanja bahan stok waste" },
  kafe: { label: "Laporan kafe", title: "Laporan kafe", icon: "storefront", href: "/app/kafe", sub: "Laporan harian dari Majoo" },
  mingguan: { label: "Mingguan", title: "Laporan mingguan", icon: "summarize", href: "/app/mingguan", sub: "Dari Manager ke Alto" },
  laporan: { label: "Laporan", title: "Laporan", icon: "monitoring", href: "/app/laporan", keywords: "omzet laba export excel pdf" },
  costing: {
    label: "Costing", title: "Costing", icon: "calculate", href: "/app/costing",
    paths: ["/app/bahan", "/app/resep", "/app/paket"], sub: "Resep, bahan, HPP",
  },
  target: { label: "Target", title: "Target & Rencana", icon: "flag", href: "/app/target", sub: "Target bulanan & tahunan, goals, roadmap" },
  tim: { label: "Tim", title: "Tim", icon: "badge", href: "/app/tim", sub: "Jadwal shift, absen, izin, gaji" },
  setuju: { label: "Persetujuan", title: "Persetujuan", icon: "approval", href: "/app/setuju", sub: "Pengajuan ke Alto" },
  lainnya: {
    label: "Menu lain", title: "Lainnya", icon: "menu", href: "/app/lainnya",
    paths: ["/app/pelanggan", "/app/produk", "/app/campaign", "/app/pengaturan"],
  },
  alat: { label: "Alat", title: "Alat & perawatan", icon: "handyman", href: "/app/alat", sub: "Daftar alat, perawatan, reparasi" },
  legal: { label: "Legal", title: "Legal & izin", icon: "gavel", href: "/app/legal", sub: "NIB, PIRT, halal, sewa · pengingat" },
  konten: { label: "Konten", title: "Konten", icon: "calendar_month", href: "/app/konten", sub: "Konten website & jadwal posting" },
};

export interface GroupDef {
  key: string;
  label: string;
  icon: IconName;
  tabs: TabKey[];
}

/** Legal and Konten belong to Lainnya but have no pill tab: they open from the Lainnya list. */
export const GROUPS: GroupDef[] = [
  { key: "beranda", label: "Beranda", icon: "home", tabs: ["beranda"] },
  { key: "order", label: "Order", icon: "receipt_long", tabs: ["order", "produksi"] },
  { key: "kafe", label: "Kafe", icon: "storefront", tabs: ["kafe", "mingguan"] },
  { key: "uang", label: "Uang", icon: "payments", tabs: ["laporan", "costing", "target"] },
  { key: "tim", label: "Tim", icon: "badge", tabs: ["tim", "setuju"] },
  { key: "lainnya", label: "Lainnya", icon: "menu", tabs: ["lainnya", "alat", "legal", "konten"] },
];

const NO_PILL: TabKey[] = ["legal", "konten"];
const ALL_TABS = Object.keys(TABS) as TabKey[];

export function tabsForRole(role: AppRole | null): TabKey[] {
  switch (role) {
    case "owner":
    case "admin":
      return ALL_TABS;
    case "produksi":
      return ["beranda", "order", "produksi", "tim", "alat"];
    case "manager":
      return ["kafe", "mingguan", "target", "tim", "setuju", "alat"];
    case "crew":
      return ["tim", "alat"];
    default:
      return [];
  }
}

/** Tab a path belongs to, or null for paths outside the app. Longest matching prefix wins. */
export function tabForPath(pathname: string): TabKey | null {
  if (pathname === "/app" || pathname === "/app/") return "beranda";
  let best: TabKey | null = null;
  let bestLen = 0;
  for (const key of ALL_TABS) {
    if (key === "beranda") continue;
    const def = TABS[key];
    for (const p of [def.href, ...(def.paths ?? [])]) {
      if ((pathname === p || pathname.startsWith(p + "/")) && p.length > bestLen) {
        best = key;
        bestLen = p.length;
      }
    }
  }
  return best;
}

export interface NavItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  active: boolean;
  /** Search words for Ctrl K (sub line + keywords). */
  search?: string;
}

export interface NavModel {
  current: TabKey;
  title: string;
  /** Top bar / bottom nav, one item per visible group. */
  groups: NavItem[];
  /** Pill tabs of the current group (empty when it has only one). */
  subTabs: NavItem[];
  /** Everything reachable, grouped, for "Semua menu" and Ctrl K. */
  allMenu: { label: string; items: NavItem[] }[];
}

/**
 * Builds the nav for the visible tabs. A group with a single tab for this person shows that tab's
 * icon and label (prototype rule). lastTab remembers the last sub visited per group.
 */
export function buildNav(tabs: TabKey[], current: TabKey, lastTab: Partial<Record<string, TabKey>> = {}): NavModel {
  const visible = GROUPS.map((g) => {
    const vis = g.tabs.filter((t) => tabs.includes(t));
    return { ...g, vis, pills: vis.filter((t) => !NO_PILL.includes(t)) };
  }).filter((g) => g.vis.length > 0);
  const cur = visible.find((g) => g.vis.includes(current)) ?? visible[0];

  const item = (t: TabKey, active: boolean): NavItem => ({
    key: t,
    label: TABS[t].label,
    icon: TABS[t].icon,
    href: TABS[t].href,
    active,
    search: [TABS[t].title, TABS[t].sub, TABS[t].keywords].filter(Boolean).join(" "),
  });

  const groups = visible.map((g) => {
    const one = g.pills.length <= 1;
    const first = g.pills[0] ?? g.vis[0];
    const remembered = lastTab[g.key];
    const target = remembered && g.pills.includes(remembered) ? remembered : first;
    return {
      key: g.key,
      label: one ? TABS[first].label : g.label,
      icon: one ? TABS[first].icon : g.icon,
      href: TABS[target].href,
      active: g === cur,
    };
  });

  const subTabs = cur && cur.pills.length > 1 ? cur.pills.map((t) => item(t, t === current)) : [];
  const allMenu = visible.map((g) => ({ label: g.label, items: g.vis.map((t) => item(t, t === current)) }));
  return { current, title: TABS[current].title, groups, subTabs, allMenu };
}

/** Where a person lands after login: their first tab. */
export function homeFor(role: AppRole | null): string {
  const first = tabsForRole(role)[0];
  return first ? TABS[first].href : "/app";
}

/** Group key of a tab, used to remember the last sub per group. */
export function groupOf(tab: TabKey): string {
  return GROUPS.find((g) => g.tabs.includes(tab))?.key ?? "beranda";
}

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/**
 * Beranda header line: "Sen 28 Sep · 87 hari ke Natal 2026". The countdown runs to the last fulfil day of the
 * next campaign that has not ended yet.
 */
export function greetLine(todayIso: string, next?: { name: string; endIso: string } | null): string {
  const [y, m, d] = todayIso.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const date = `${DAY_SHORT[day]} ${d} ${MONTH_SHORT[m - 1]}`;
  if (!next) return date;
  const [ey, em, ed] = next.endIso.split("-").map(Number);
  const days = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(y, m - 1, d)) / 86_400_000);
  if (days < 0) return date;
  return days === 0 ? `${date} · hari ini ${next.name}` : `${date} · ${days} hari ke ${next.name}`;
}
