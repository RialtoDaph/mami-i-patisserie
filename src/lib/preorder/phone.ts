/**
 * Normalizes an Indonesian WhatsApp number to "62xxxxxxxxxx" (no "+").
 * Accepts "0812…", "812…", "+62 812-…", "62812…". Returns null if invalid.
 * Mirrors the customers.whatsapp check constraint.
 */
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("8")) digits = "62" + digits;
  return /^62\d{7,13}$/.test(digits) ? digits : null;
}

/** "6281234567890" → "0812-3456-7890" */
export function formatWhatsapp(normalized: string): string {
  const local = normalized.startsWith("62") ? "0" + normalized.slice(2) : normalized;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}
