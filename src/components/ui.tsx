import Link from "next/link";
import type { HppStatus } from "@/lib/costing";
import { formatPercent } from "@/lib/format";

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
        <Link href={back} className="-ml-2 flex min-h-12 min-w-12 items-center justify-center rounded-xl text-2xl text-cocoa" aria-label="Kembali">
          ←
        </Link>
      )}
      <h1 className="flex-1 text-2xl font-bold text-cocoa">{title}</h1>
      {action}
    </header>
  );
}

export function HppBadge({ hpp, status, size = "md" }: { hpp: number | null; status: HppStatus; size?: "md" | "lg" }) {
  const cls =
    status === "under" ? "bg-ok-bg text-ok" : status === "over" ? "bg-bad-bg text-bad" : "bg-black/5 text-muted";
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
  return <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">DUMMY</span>;
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
