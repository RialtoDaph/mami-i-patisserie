// Campaign copy from the design handoff. Dates, quotas and products live in the campaigns table.

/** Lebaran 2027 timeline copy (dates and quota themselves come from the campaigns table). */
export const LEBARAN_2027 = {
  timeline: [
    { month: "JAN", day: "15", title: "Pre-order dibuka", text: "Pilih hampers, tulis kartu, bayar DP 40%.", band: "wine", tilt: -1.2 },
    { month: "MAR", day: "3", title: "Order ditutup", text: "Batas terakhir pesan & DP, atau saat kuota penuh.", band: "espresso", tilt: 0.8 },
    { month: "MAR", day: "5–8", title: "Kirim & ambil", text: "Kurir instan di Bandung, ekspedisi untuk luar kota.", band: "pistachio-deep", tilt: -0.6 },
    { month: "MAR", day: "±10", title: "Lebaran", text: "Hampers sudah di tangan sebelum hari raya.", band: "wine", tilt: 1 },
  ],
} as const;

/** Whole days from `now` until `iso` (rounded up), never negative. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-12-18" → "18 Des 2026" (or "18 Des" without the year). */
export function shortDate(iso: string, withYear = true): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "20–24 Des" for a range in the same month, else "28 Nov – 2 Des". */
export function shortRange(from: string, to: string): string {
  const [, m1, d1] = from.split("-").map(Number);
  const [, m2, d2] = to.split("-").map(Number);
  return m1 === m2 ? `${d1}–${d2} ${MONTHS[m1 - 1]}` : `${shortDate(from, false)} – ${shortDate(to, false)}`;
}

/** End of a Jakarta calendar day as an ISO instant. */
export const endOfDayJakarta = (iso: string) => `${iso}T23:59:59+07:00`;

const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** "2026-12-18" → "18 Desember 2026". */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "20–24 Desember 2026" (same month) or "28 November – 2 Desember 2026". */
export function longRange(from: string, to: string): string {
  const [, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return m1 === m2 ? `${d1}–${d2} ${MONTHS_LONG[m2 - 1]} ${y2}` : `${d1} ${MONTHS_LONG[m1 - 1]} – ${longDate(to)}`;
}
