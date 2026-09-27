import { site } from "@/content/site";
import { whatsAppUrl } from "@/lib/site/orderMessage";

export function WhatsAppButton({ text, label = "Chat WhatsApp", className = "btn-wine" }: { text: string; label?: string; className?: string }) {
  const href = whatsAppUrl(site.whatsapp, text);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <span aria-hidden>💬</span> {label}
    </a>
  );
}
