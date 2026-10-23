import Link from "next/link";
import type { HppStatus } from "@/lib/costing";
import { formatPercent } from "@/lib/format";
import { Icon } from "@/components/brand";

/** Section title inside an app page (the shell header already shows the tab title). */
export function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-center gap-2">
      {back && (
        <Link href={back} className="-ml-2 flex min-h-11 min-w-11 items-center justify-center rounded-md text-brand-espresso hover:bg-brand-butter" aria-label="Kembali">
          <Icon name="arrow_back" size={24} />
        </Link>
      )}
      <h2 className="flex-1 font-display text-xl font-bold text-brand-espresso">{title}</h2>
      {action}
    </header>
  );
}

export function HppBadge({ hpp, status, size = "md" }: { hpp: number | null; status: HppStatus; size?: "md" | "lg" }) {
  const cls =
    status === "under" ? "bg-brand-pistachio text-brand-espresso" : status === "over" ? "bg-brand-wine text-brand-butter" : "bg-brand-espresso/5 text-muted";
  const label = status === "under" ? "di bawah target" : status === "over" ? "di atas target" : "belum ada harga jual";
  return (
    <span
      className={`inline-flex flex-col items-end rounded-xl px-3 py-1 font-bold ${cls} ${size === "lg" ? "text-3xl" : "text-lg"}`}
      title={label}
    >
      {hpp == null ? "–" : formatPercent(hpp)}
      <span className="text-[11px] font-semibold opacity-80">{status === "unknown" ? "HPP" : `HPP · ${label}`}</span>
    </span>
  );
}

export function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-muted">{label}</span>
      <span className={`whitespace-nowrap text-right tabular-nums ${strong ? "text-lg font-bold" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

export function DummyTag({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="ml-1 rounded bg-brand-butter px-1.5 py-0.5 text-[11px] font-bold text-brand-espresso">DUMMY</span>;
}

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-bad/30 bg-bad-bg p-3 text-sm font-semibold text-bad">
      {message}
    </p>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="card text-center text-muted">{children}</p>;
}
