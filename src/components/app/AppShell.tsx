"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/brand";
import { buildNav, groupOf, tabForPath, type NavItem, type TabKey } from "@/lib/appNav";

const LAST_KEY = "mami-app-last-tab";

export interface ShellProps {
  tabs: TabKey[];
  userLabel: string;
  greeting: string;
  headSub: string;
  canOrder: boolean;
  /** Extra Ctrl K targets that are not tabs (Pelanggan, Produk, Akun tim…). */
  extras: { label: string; href: string; icon: IconName; group: string }[];
  signOut: () => Promise<void>;
  children: React.ReactNode;
}

// Last sub tab per group, kept in localStorage (per device convenience only).
const lastStore = {
  read(): string {
    try {
      return localStorage.getItem(LAST_KEY) ?? "{}";
    } catch {
      return "{}";
    }
  },
  write(value: string) {
    try {
      localStorage.setItem(LAST_KEY, value);
    } catch {
      // Private mode: only the default sub tab is remembered.
    }
    window.dispatchEvent(new Event(LAST_KEY));
  },
  subscribe(cb: () => void) {
    window.addEventListener(LAST_KEY, cb);
    return () => window.removeEventListener(LAST_KEY, cb);
  },
};

/**
 * Internal app frame (prototype "App Internal v2"): top bar ≥ 760px, bottom nav on phones, one-line page
 * header with pill tabs (phone) or underline tabs (wider), "Semua menu" and a Ctrl K menu search.
 */
export function AppShell({ tabs, userLabel, greeting, headSub, canOrder, extras, signOut, children }: ShellProps) {
  const pathname = usePathname();
  const current = tabForPath(pathname) ?? tabs[0] ?? "beranda";
  const lastRaw = useSyncExternalStore(lastStore.subscribe, lastStore.read, () => "{}");
  const last = useMemo<Partial<Record<string, TabKey>>>(() => {
    try {
      return JSON.parse(lastRaw);
    } catch {
      return {};
    }
  }, [lastRaw]);
  // Menus remember the path they were opened on, so navigating closes them without an effect.
  const [menuAllAt, setMenuAllAt] = useState<string | null>(null);
  const [cmdAt, setCmdAt] = useState<string | null>(null);
  const menuAll = menuAllAt === pathname;
  const cmd = cmdAt === pathname;
  const setMenuAll = (open: boolean | ((v: boolean) => boolean)) =>
    setMenuAllAt((at) => ((typeof open === "function" ? open(at === pathname) : open) ? pathname : null));
  const setCmd = (open: boolean | ((v: boolean) => boolean)) =>
    setCmdAt((at) => ((typeof open === "function" ? open(at === pathname) : open) ? pathname : null));

  useEffect(() => {
    const key = groupOf(current);
    const stored = JSON.parse(lastStore.read() || "{}") as Partial<Record<string, TabKey>>;
    if (stored[key] !== current) lastStore.write(JSON.stringify({ ...stored, [key]: current }));
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdAt((at) => (at === pathname ? null : pathname));
        setMenuAllAt(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname]);

  const nav = useMemo(() => buildNav(tabs, current, last), [tabs, current, last]);
  const title = current === "beranda" ? greeting : nav.title;
  const sub = current === "beranda" ? headSub : "";

  return (
    <div className="flex min-h-dvh flex-col bg-brand-butter-100 text-brand-espresso">
      {/* Top bar (tablet/desktop) */}
      <div className="sticky top-0 z-30 hidden h-16 items-center gap-3 border-b-[1.5px] border-dashed border-brand-espresso/30 bg-brand-butter-50 px-4 nav:flex wide:gap-5 wide:px-6">
        <Link href={nav.groups[0]?.href ?? "/app"} className="flex flex-none items-baseline gap-[7px] font-display text-[22px] leading-none font-bold whitespace-nowrap">
          <i>Mami</i>
          <span className="text-brand-wine">I</span>
        </Link>
        <nav aria-label="Navigasi" className="no-scrollbar flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
          {nav.groups.map((g) => (
            <Link
              key={g.key}
              href={g.href}
              aria-current={g.active ? "page" : undefined}
              className={`flex min-h-11 flex-none items-center gap-2 rounded-md px-2.5 text-[15px] font-bold whitespace-nowrap wide:px-3.5 ${
                g.active ? "bg-brand-wine-50 text-brand-wine" : "text-brand-muted hover:bg-brand-butter"
              }`}
            >
              <Icon name={g.icon} size={20} />
              {g.label}
            </Link>
          ))}
        </nav>
        {canOrder && (
          <Link
            href="/app/order/baru"
            aria-label="Order baru"
            className="flex min-h-11 flex-none items-center gap-1.5 rounded-md bg-brand-wine px-4 text-[15px] font-bold whitespace-nowrap text-brand-butter hover:brightness-[.92]"
          >
            <Icon name="add" size={20} />
            <span className="hidden xwide:inline">Order baru</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setCmd(true);
            setMenuAll(false);
          }}
          aria-label="Cari menu"
          className="flex min-h-11 w-11 flex-none items-center gap-2 rounded-md border-[1.5px] border-brand-espresso/22 bg-white px-3 text-left text-sm text-brand-muted xwide:w-[200px]"
        >
          <Icon name="search" size={18} />
          <span className="hidden flex-1 xwide:inline">Cari menu…</span>
          <span className="hidden text-xs xwide:inline">Ctrl K</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMenuAll((v) => !v);
            setCmd(false);
          }}
          aria-expanded={menuAll}
          aria-label="Semua menu"
          className="flex min-h-11 flex-none items-center gap-1.5 rounded-md border-[1.5px] border-brand-espresso/25 px-3.5 text-sm font-bold whitespace-nowrap"
        >
          <Icon name="apps" size={20} />
          <span className="hidden xwide:inline">Semua menu</span>
        </button>
        <div className="flex flex-none items-center gap-2 border-l border-brand-espresso/15 pl-3 wide:pl-4">
          <span className="hidden text-[13px] font-bold whitespace-nowrap xwide:inline">{userLabel}</span>
          <form action={signOut}>
            <button
              type="submit"
              title="Keluar"
              aria-label="Keluar"
              className="flex size-11 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/20 text-brand-wine"
            >
              <Icon name="logout" size={20} />
            </button>
          </form>
        </div>
      </div>

      {menuAll && <AllMenu groups={nav.allMenu} onClose={() => setMenuAll(false)} />}
      {cmd && <CommandMenu items={[...nav.allMenu.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), ...extras.map((e) => ({ ...e, key: e.href, active: false }))]} onClose={() => setCmd(false)} />}

      {/* Page header */}
      <header className="flex flex-none flex-col gap-2 border-b-[1.5px] border-dashed border-brand-espresso/30 bg-brand-butter-50 px-4 pt-2.5 pb-2.5 nav:px-7 nav:pt-4 nav:pb-0">
        <div className="flex min-h-[30px] items-center justify-between nav:hidden">
          <span className="flex items-baseline gap-[5px] font-display text-[17px] leading-none font-bold whitespace-nowrap">
            <i>Mami</i>
            <span className="text-brand-wine">I</span>
          </span>
          {canOrder && (current === "beranda" || current === "order") ? (
            <Link href="/app/order/baru" className="flex min-h-10 items-center gap-1 rounded-md bg-brand-wine px-3.5 text-sm font-bold text-brand-butter">
              <Icon name="add" size={18} />
              Order
            </Link>
          ) : (
            <span className="text-xs font-bold tracking-[.14em] text-brand-pistachio-deep uppercase">Aplikasi tim</span>
          )}
        </div>
        <div className={`flex flex-wrap items-baseline gap-x-3.5 gap-y-1 ${nav.subTabs.length ? "" : "nav:pb-3"}`}>
          <h1 className="font-display text-[22px] leading-[1.15] font-bold nav:text-[26px]">{title}</h1>
          {sub && <span className="text-sm text-brand-muted">{sub}</span>}
        </div>
        {nav.subTabs.length > 0 && <SubTabs items={nav.subTabs} />}
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-3.5 pt-3 pb-24 nav:px-6 nav:pt-4 nav:pb-8">{children}</main>

      {/* Bottom nav (phone) */}
      <nav aria-label="Navigasi" className="fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-brand-espresso/15 bg-brand-butter-50 pb-[env(safe-area-inset-bottom)] nav:hidden">
        <ul className="flex">
          {nav.groups.map((g) => (
            <li key={g.key} className="min-w-0 flex-1">
              <Link
                href={g.href}
                aria-current={g.active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-xs font-bold ${
                  g.active ? "text-brand-wine" : "text-brand-muted"
                }`}
              >
                <span className={`absolute inset-x-3 top-0 h-[3px] rounded-b ${g.active ? "bg-brand-wine" : "bg-transparent"}`} />
                <Icon name={g.icon} size={24} />
                <span className="max-w-full truncate">{g.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function SubTabs({ items }: { items: NavItem[] }) {
  return (
    <>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 nav:hidden">
        {items.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            aria-current={s.active ? "page" : undefined}
            className={`flex min-h-[38px] flex-none items-center gap-1.5 rounded-full border-[1.5px] px-3 text-sm font-bold whitespace-nowrap ${
              s.active ? "border-brand-espresso bg-brand-espresso text-brand-butter" : "border-brand-espresso/22 text-brand-muted"
            }`}
          >
            <Icon name={s.icon} size={18} />
            {s.label}
          </Link>
        ))}
      </div>
      <div className="no-scrollbar hidden gap-2 overflow-x-auto nav:flex">
        {items.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            aria-current={s.active ? "page" : undefined}
            className={`flex min-h-12 flex-none items-center gap-2 border-b-2 px-3 text-base font-bold whitespace-nowrap ${
              s.active ? "border-brand-wine text-brand-espresso" : "border-transparent text-brand-muted hover:text-brand-espresso"
            }`}
          >
            <Icon name={s.icon} size={20} />
            {s.label}
          </Link>
        ))}
      </div>
    </>
  );
}

function AllMenu({ groups, onClose }: { groups: { label: string; items: NavItem[] }[]; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-brand-espresso-deep/35" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 border-b-[1.5px] border-brand-espresso/20 bg-brand-butter-50 px-8 pt-6 pb-7 shadow-[0_14px_30px_rgb(42_26_23/.18)]"
      >
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-[.14em] text-brand-pistachio-deep uppercase">{g.label}</span>
            {g.items.map((i) => (
              <Link
                key={i.key}
                href={i.href}
                className={`flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-[15px] font-semibold ${i.active ? "bg-brand-wine-50" : "hover:bg-brand-butter"}`}
              >
                <Icon name={i.icon} size={20} className="text-brand-wine" />
                {i.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandMenu({ items, onClose }: { items: (NavItem & { group: string })[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const query = q.toLowerCase().trim();
  const hits = items.filter((i) => !query || `${i.label} ${i.group} ${i.search ?? ""}`.toLowerCase().includes(query)).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-brand-espresso-deep/45 px-4 pt-[12vh]" onClick={onClose}>
      <div role="dialog" aria-label="Cari menu" onClick={(e) => e.stopPropagation()} className="w-[520px] max-w-full overflow-hidden rounded-lg bg-white shadow-[0_20px_50px_rgb(42_26_23/.35)]">
        <div className="flex items-center gap-2.5 border-b-[1.5px] border-brand-espresso/12 px-4">
          <Icon name="search" size={22} className="text-brand-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]) router.push(hits[0].href);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Ketik nama menu, mis. gaji, stok, target"
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </div>
        <div className="flex max-h-[340px] flex-col overflow-auto p-1.5">
          {hits.map((i, n) => (
            <Link
              key={i.key + i.group}
              href={i.href}
              className={`flex min-h-[46px] items-center gap-3 rounded-md px-3 text-[15px] ${n === 0 && query ? "bg-brand-wine-50" : "hover:bg-brand-butter-50"}`}
            >
              <Icon name={i.icon} size={20} className="text-brand-wine" />
              <b className="font-semibold">{i.label}</b>
              <span className="ml-auto text-[13px] text-brand-muted">{i.group}</span>
            </Link>
          ))}
          {hits.length === 0 && <span className="px-3 py-3.5 text-sm text-brand-muted">Tidak ada menu yang cocok.</span>}
        </div>
      </div>
    </div>
  );
}
