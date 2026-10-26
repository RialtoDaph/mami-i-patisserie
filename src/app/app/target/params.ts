// URL state of /app/target: view, period mode, month/year, goal area and roadmap year.

export type TargetView = "target" | "goals" | "roadmap";

export interface TargetParams {
  v: TargetView;
  p: "bulan" | "tahun";
  m: string;
  y: number;
  area: string | null;
  ry: number;
}

export function readTargetParams(sp: Record<string, string | undefined>, today: string): TargetParams {
  const year = Number(today.slice(0, 4));
  const int = (s: string | undefined, d: number) => (s && /^\d{4}$/.test(s) ? Number(s) : d);
  return {
    v: sp.v === "goals" || sp.v === "roadmap" ? sp.v : "target",
    p: sp.p === "tahun" ? "tahun" : "bulan",
    m: sp.m && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.m) ? sp.m : today.slice(0, 7),
    y: int(sp.y, year),
    area: sp.area || null,
    ry: int(sp.ry, year),
  };
}

export function targetHref(p: Partial<TargetParams> & { v: TargetView }): string {
  const q = new URLSearchParams();
  if (p.v !== "target") q.set("v", p.v);
  if (p.p === "tahun") q.set("p", "tahun");
  if (p.m) q.set("m", p.m);
  if (p.y) q.set("y", String(p.y));
  if (p.area) q.set("area", p.area);
  if (p.ry) q.set("ry", String(p.ry));
  const s = q.toString();
  return `/app/target${s ? `?${s}` : ""}`;
}

export const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
