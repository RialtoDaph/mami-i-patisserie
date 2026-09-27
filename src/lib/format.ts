// Indonesian number/money formatting, independent of the runtime's ICU data.

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formats a number with "." thousands and "," decimals, e.g. 1234.5 → "1.234,5". */
export function formatNumber(n: number, maxDecimals = 0): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(Math.abs(n) * factor) / factor;
  const [int, frac = ""] = rounded.toFixed(maxDecimals).split(".");
  const trimmed = frac.replace(/0+$/, "");
  const sign = n < 0 && rounded !== 0 ? "-" : "";
  return sign + groupThousands(int) + (trimmed ? "," + trimmed : "");
}

/** "Rp 25.000" (rounded to whole Rupiah). Negative values: "-Rp 1.500". */
export function formatRupiah(n: number | null | undefined, maxDecimals = 0): string {
  if (n == null || Number.isNaN(n)) return "–";
  const s = formatNumber(n, maxDecimals);
  return s.startsWith("-") ? `-Rp ${s.slice(1)}` : `Rp ${s}`;
}

/** "34,5%" */
export function formatPercent(n: number | null | undefined, maxDecimals = 1): string {
  if (n == null || Number.isNaN(n)) return "–";
  return `${formatNumber(n, maxDecimals)}%`;
}

/** Parses user input like "25.000", "25000", "1,5" into a number. Returns null if invalid. */
export function parseNumberInput(input: string): number | null {
  const s = input.trim().replace(/\s/g, "").replace(/^rp/i, "");
  if (!s) return null;
  // Indonesian style: dots group thousands, comma is the decimal separator.
  const normalized = /,/.test(s) ? s.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
