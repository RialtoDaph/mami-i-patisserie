/** Handwritten Kalam accent ("freshly baked daily", "harga menyusul"). Usually wine, tilted −2°. */
export function Script({
  as: Tag = "span",
  tilt = -2,
  size = 24,
  className,
  children,
}: {
  as?: "span" | "p";
  tilt?: number;
  size?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={`block w-max max-w-full origin-left font-script leading-[1.2] ${className ?? "text-brand-wine"}`}
      style={{ fontSize: size, transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {children}
    </Tag>
  );
}

/** Section heading: Kalam eyebrow + Libre Baskerville h2 + optional aside on the right. */
export function SectionHead({
  script,
  title,
  aside,
  center,
  light,
  as: H = "h2",
}: {
  script?: React.ReactNode;
  title: React.ReactNode;
  aside?: React.ReactNode;
  center?: boolean;
  light?: boolean;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={`flex flex-wrap items-end gap-x-6 gap-y-3 ${center ? "justify-center text-center" : "justify-between"}`}>
      <div className={`flex flex-col gap-1 ${center ? "items-center" : ""}`}>
        {script && (
          <Script tilt={0} className={light ? "text-brand-butter" : "text-brand-wine"}>
            {script}
          </Script>
        )}
        <H className={`font-display text-[clamp(30px,4.5vw,44px)] leading-[1.05] font-bold text-balance ${light ? "text-brand-butter" : ""}`}>{title}</H>
      </div>
      {aside && <div className={`text-sm ${light ? "text-brand-butter/90" : "text-brand-muted"}`}>{aside}</div>}
    </div>
  );
}
