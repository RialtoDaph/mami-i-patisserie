import Image from "next/image";

/**
 * Photo slot. With `src` it renders next/image (cover). Without it, the striped placeholder with a
 * monospace caption describing the photo still to come ("foto croissant, top-down").
 */
export function Photo({
  src,
  alt,
  placeholder,
  ratio = "4/5",
  sizes = "(max-width: 700px) 100vw, 33vw",
  priority,
  position,
  className,
}: {
  src?: string | null;
  alt: string;
  placeholder?: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  position?: string;
  className?: string;
}) {
  return (
    <div className={`photo-slot relative overflow-hidden ${className ?? ""}`} style={{ aspectRatio: ratio }}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" style={position ? { objectPosition: position } : undefined} />
      ) : (
        <span role="img" aria-label={alt} className="absolute inset-x-0 bottom-0 p-3 font-mono text-xs leading-snug text-brand-muted">
          {placeholder ?? alt}
        </span>
      )}
    </div>
  );
}

/** Polaroid / postcard frame: 12px white border, 48px bottom with a Kalam caption, slight tilt. */
export function Polaroid({
  tilt = 0,
  caption,
  paper = "white",
  shadow = "soft",
  className,
  children,
}: {
  tilt?: number;
  caption?: React.ReactNode;
  paper?: "white" | "butter";
  shadow?: "soft" | "deep";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      className={`relative px-3 pt-3 pb-12 ${paper === "white" ? "bg-white" : "bg-brand-butter-50"} ${shadow === "soft" ? "shadow-polaroid" : "shadow-[0_24px_48px_rgb(42_26_23/.35)]"} ${className ?? ""}`}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      {children}
      {caption && <figcaption className="absolute right-[18px] bottom-2 font-script text-[22px] leading-[1.6] text-brand-wine">{caption}</figcaption>}
    </figure>
  );
}

/** Arched frame (hero "sekarang", Tentang): 12px espresso border, radius 220px 220px 6px 6px. */
export function ArchFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden border-[12px] border-brand-espresso bg-brand-butter-100 ${className ?? ""}`} style={{ borderRadius: "220px 220px 6px 6px" }}>
      {children}
    </div>
  );
}

/** Round pistachio sticker (128px): big number + small uppercase line. Text on pistachio is espresso. */
export function Sticker({ big, small, tilt = 8, size = 128, className }: { big: React.ReactNode; small: React.ReactNode; tilt?: number; size?: number; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full bg-brand-pistachio text-brand-espresso shadow-[0_8px_20px_rgb(62_39_35/.2)] ${className ?? ""}`}
      style={{ width: size, height: size, transform: `rotate(${tilt}deg)` }}
    >
      <span className="mb-1.5 font-display text-[clamp(30px,7.5vw,40px)] leading-[.9] font-bold">{big}</span>
      <span className={`font-bold tracking-[.14em] uppercase ${size < 128 ? "text-[10px]" : "text-[11px]"}`}>{small}</span>
    </div>
  );
}
