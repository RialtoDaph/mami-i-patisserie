import Link from "next/link";
import { Icon } from "@/components/brand";
import { WA_ASK, waLink } from "@/lib/site/wa";

/** Beranda › Current. `light` = on wine/natal backgrounds. */
export function Breadcrumb({ current, light }: { current: string; light?: boolean }) {
  const c = light ? "text-brand-butter-50" : "text-brand-muted";
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm ${c}`}>
      <Link href="/" className={c}>
        Beranda
      </Link>
      <Icon name="chevron_right" size={16} />
      <span className={`font-semibold ${light ? "" : "text-brand-espresso"}`}>{current}</span>
    </nav>
  );
}

/** WhatsApp CTA. Hidden until NEXT_PUBLIC_WHATSAPP_NUMBER is set (decision 2026-09-27). */
export function WaButton({ text = WA_ASK, className, children }: { text?: string; className: string; children: React.ReactNode }) {
  const href = waLink(text);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

/** Washi tape strip on postcards. */
export function Tape({ className, tilt }: { className?: string; tilt: number }) {
  return (
    <span
      aria-hidden
      className={`absolute h-[26px] w-24 bg-brand-butter/85 shadow-[0_1px_2px_rgb(62_39_35/.15)] ${className ?? ""}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    />
  );
}

/** Section wrapper with the page gutter and standard vertical rhythm. */
export function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={`px-page scroll-mt-[72px] py-[clamp(52px,8vw,88px)] ${className ?? ""}`}>
      {children}
    </section>
  );
}
