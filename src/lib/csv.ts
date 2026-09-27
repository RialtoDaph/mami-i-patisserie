/** Builds RFC 4180 CSV text. Values containing ; , " or newlines are quoted. */
export function toCsv(rows: (string | number | null | undefined)[][], separator = ","): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    // Neutralize spreadsheet formula injection for text cells.
    const safe = typeof v === "string" && /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",;\r\n]/.test(safe) || safe.includes(separator) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return rows.map((r) => r.map(escape).join(separator)).join("\r\n") + "\r\n";
}
