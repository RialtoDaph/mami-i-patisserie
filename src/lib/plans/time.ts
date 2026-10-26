// Times for Persetujuan: Alto lives in Germany, the team in Bandung, so deadlines show both clocks.

const fmt = (ms: number, tz: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: tz, ...o }).format(ms).replace(/(\d{2})\.(\d{2})/g, "$1:$2");

/** "Sen, 27 Okt, 15:20 WIB · 09:20 Jerman" */
export function dualTime(ms: number): string {
  return `${fmt(ms, "Asia/Jakarta", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB · ${fmt(ms, "Europe/Berlin", { hour: "2-digit", minute: "2-digit" })} Jerman`;
}

/** "baru saja", "5 jam lalu", "2 hari lalu" */
export function ago(ms: number, now: number): string {
  const h = Math.floor((now - ms) / 3_600_000);
  return h < 1 ? "baru saja" : h < 24 ? `${h} jam lalu` : `${Math.floor(h / 24)} hari lalu`;
}

export function clock(tz: string, now: number): { time: string; day: string } {
  return { time: fmt(now, tz, { hour: "2-digit", minute: "2-digit" }), day: fmt(now, tz, { weekday: "long" }) };
}

/** Request time for server components (they render once per request). */
export function requestTime(): number {
  return Date.now();
}
