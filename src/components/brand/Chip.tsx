import type { ComponentProps } from "react";

/** Filter chip (pill). Active = espresso fill (website menu filter) or wine (`tone="wine"`). */
export function Chip({
  active,
  count,
  tone = "espresso",
  className,
  children,
  ...rest
}: { active?: boolean; count?: number; tone?: "espresso" | "wine" } & ComponentProps<"button">) {
  const on = tone === "wine" ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso bg-brand-espresso text-brand-butter";
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] px-[18px] text-[15px] font-bold whitespace-nowrap transition-colors ${
        active ? on : "border-brand-espresso/30 bg-transparent text-brand-espresso hover:bg-brand-espresso/5"
      } ${className ?? ""}`}
      {...rest}
    >
      {children}
      {count != null && <span className={`text-xs tabular-nums ${active ? "opacity-80" : "text-brand-muted"}`}>{count}</span>}
    </button>
  );
}

/** Small label: "SIGNATURE" (wine), status badges, contents chips ("4× Croissant"). */
export function Tag({
  tone = "outline",
  className,
  children,
}: {
  tone?: "outline" | "wine" | "pistachio" | "espresso" | "butter" | "natal";
  className?: string;
  children: React.ReactNode;
}) {
  const cls = {
    outline: "border border-brand-espresso/25 text-brand-espresso font-medium",
    wine: "bg-brand-wine text-brand-butter font-bold uppercase tracking-[.08em] text-[11px]",
    pistachio: "bg-brand-pistachio text-brand-espresso font-bold", // text on pistachio is always espresso
    espresso: "bg-brand-espresso text-brand-butter font-bold",
    butter: "bg-brand-butter text-brand-espresso font-bold",
    natal: "bg-brand-natal text-brand-butter font-bold",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] leading-tight ${cls} ${className ?? ""}`}>{children}</span>;
}

/** Uppercase eyebrow label: "2 TOPLES", "HAMPERS KUE KERING". */
export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={`text-xs font-bold uppercase tracking-[.16em] ${className ?? "text-brand-wine"}`}>{children}</span>;
}
