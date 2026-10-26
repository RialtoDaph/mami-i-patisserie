import Link from "next/link";
import { Icon, type IconName } from "@/components/brand";
import { clock } from "@/lib/plans/time";

// Internal app building blocks (prototype "App Internal v2"): butter-50 panels with 1.5px lines and 6px radius,
// uppercase section labels, tappable list rows, local underline tabs and rectangular filter chips.

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 ${className ?? "p-[18px]"}`}>{children}</section>;
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xs font-bold tracking-[.14em] text-brand-pistachio-deep uppercase ${className ?? ""}`}>{children}</h2>;
}

export function PanelTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-bold">{children}</h2>
      {aside && <span className="text-[13px] font-bold text-brand-muted">{aside}</span>}
    </div>
  );
}

/** Tappable row with an icon, title, sub line and chevron (Beranda focus list, Lainnya). */
export function ListRow({
  href, icon, title, sub, tone = "wine", first,
}: {
  href: string;
  icon: IconName;
  title: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "wine" | "muted";
  first?: boolean;
}) {
  return (
    <Link href={href} className={`flex min-h-16 items-center gap-3.5 px-4 py-2.5 hover:bg-brand-butter ${first ? "" : "border-t border-brand-espresso/10"}`}>
      <Icon name={icon} size={22} className={tone === "wine" ? "text-brand-wine" : "text-brand-muted"} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold">{title}</span>
        {sub && <span className="block text-[13px] text-brand-muted">{sub}</span>}
      </span>
      <Icon name="chevron_right" size={22} className="text-brand-muted" />
    </Link>
  );
}

/** Underline tabs inside a page (e.g. Produksi: Jadwal · Belanja · Stok · Waste). */
export function LocalTabs({ items }: { items: { href: string; label: string; icon: IconName; active: boolean }[] }) {
  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b-[1.5px] border-dashed border-brand-espresso/25 px-1">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`-mb-[1.5px] flex min-h-11 flex-none items-center gap-1.5 border-b-2 px-2 text-[15px] font-bold whitespace-nowrap nav:px-3 ${
            t.active ? "border-brand-wine text-brand-wine" : "border-transparent text-brand-muted hover:text-brand-espresso"
          }`}
        >
          <Icon name={t.icon} size={18} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export const chipClass = (active: boolean) =>
  `inline-flex min-h-10 flex-none items-center rounded-md border-[1.5px] px-3.5 text-sm font-bold whitespace-nowrap ${
    active ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso/22 bg-brand-butter-50 text-brand-espresso hover:bg-brand-butter"
  }`;

export function ChipLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={chipClass(active)}>
      {children}
    </Link>
  );
}

/** KPI card: label, big value, optional progress bar and note (Beranda). */
export function Kpi({
  label, value, note, progress, tone = "wine",
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  progress?: number | null;
  tone?: "wine" | "olive" | "espresso";
}) {
  const bar = tone === "wine" ? "bg-brand-wine" : tone === "olive" ? "bg-brand-olive" : "bg-brand-espresso";
  const text = tone === "olive" ? "text-brand-olive" : "text-brand-espresso";
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-3.5 py-3">
      <span className="text-[13px] font-bold text-brand-pistachio-deep">{label}</span>
      <span className={`font-display text-[22px] leading-tight font-bold tabular-nums ${text}`}>{value}</span>
      {progress != null && (
        <span className="h-1.5 overflow-hidden rounded-full bg-brand-espresso/10">
          <span className={`block h-full rounded-full ${bar}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </span>
      )}
      {note && <span className="text-xs leading-snug text-brand-muted">{note}</span>}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border-[1.5px] border-dashed border-brand-espresso/20 px-4 py-6 text-center text-[15px] text-brand-muted">{children}</p>;
}

/** Indonesia + Germany clocks (Alto lives in Germany). */
export function Clocks({ now }: { now: number }) {
  return (
    <span className="flex flex-wrap gap-2">
      {[
        ["Indonesia", "Asia/Jakarta"],
        ["Jerman", "Europe/Berlin"],
      ].map(([label, tz]) => {
        const c = clock(tz, now);
        return (
          <span key={tz} className="flex items-baseline gap-1.5 rounded-full border-[1.5px] border-brand-espresso/18 bg-white px-3 py-1">
            <span className="text-[11px] font-bold tracking-wider text-brand-pistachio-deep uppercase">{label}</span>
            <b className="font-display text-sm tabular-nums">{c.time}</b>
            <span className="text-[11px] text-brand-muted capitalize">{c.day}</span>
          </span>
        );
      })}
    </span>
  );
}

/** Small status pill (approval and milestone states). */
export function StatusPill({ tone, children }: { tone: "butter" | "olive" | "wine" | "white"; children: React.ReactNode }) {
  const cls = {
    butter: "bg-brand-butter text-brand-espresso",
    olive: "bg-brand-pistachio-50 text-brand-olive",
    wine: "bg-brand-wine-50 text-brand-wine",
    white: "border border-brand-espresso/25 bg-white text-brand-muted",
  }[tone];
  return <span className={`inline-flex flex-none items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${cls}`}>{children}</span>;
}
