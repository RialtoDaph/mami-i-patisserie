// Campaign dates & quotas from the design handoff (KEPUTUSAN.md / prototype). Stage 4 moves these into the
// `campaigns` table. Dates are Asia/Jakarta.

export const NATAL_2026 = {
  name: "Natal 2026",
  /** Last moment to order. */
  closeAt: "2026-12-18T23:59:59+07:00",
  /** Pickup / delivery window (inclusive). */
  fulfilFrom: "2026-12-20",
  fulfilTo: "2026-12-24",
  /** Default box quota; the live value comes from settings (natal_quota). */
  quota: 100,
} as const;

export const LEBARAN_2027 = {
  name: "Lebaran 2027",
  openAt: "2027-01-15T00:00:00+07:00",
  quota: 150,
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
