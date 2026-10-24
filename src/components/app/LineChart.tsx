import { formatRupiah } from "@/lib/format";

/** Small line chart (Beranda "Omzet 30 hari"). One or more series over the same days; pure SVG, no library. */
export function LineChart({
  days, series, height = 150,
}: {
  days: string[];
  series: { label: string; values: number[]; color: string; fill?: boolean }[];
  height?: number;
}) {
  const w = 500;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => (days.length > 1 ? (i / (days.length - 1)) * w : 0);
  const y = (v: number) => height - 6 - (v / max) * (height - 16);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const label = (iso: string) => {
    const [, m, d] = iso.split("-").map(Number);
    return `${d} ${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][m - 1]}`;
  };
  return (
    <figure className="flex flex-col gap-1.5">
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-[150px] w-full" role="img" aria-label={`Grafik ${series.map((s) => s.label).join(" dan ")}, puncak ${formatRupiah(max)}`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={height * f} y2={height * f} stroke="rgb(62 39 35 / .08)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s) =>
          s.fill ? <path key={`${s.label}-fill`} d={`${path(s.values)} L${w},${height} L0,${height} Z`} fill={s.color} opacity="0.1" /> : null,
        )}
        {series.map((s) => (
          <path key={s.label} d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <figcaption className="flex justify-between text-xs font-bold text-brand-muted">
        <span>{label(days[0])}</span>
        <span>{label(days[days.length - 1])}</span>
      </figcaption>
    </figure>
  );
}
