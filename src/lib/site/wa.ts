import { site } from "@/content/site";
import { normalizeWhatsapp } from "@/lib/preorder/phone";

/** wa.me link to the business number with a prefilled message, or null while the number is not set. */
export function waLink(text?: string): string | null {
  const number = site.whatsapp ? normalizeWhatsapp(site.whatsapp) : null;
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const WA_ASK = "Halo Mami I Patisserie, saya mau tanya.";
