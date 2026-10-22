/** Café canopy motifs: striped awning with round scalloped fringe, divider strip, mini fringe. */

const WINE = "var(--color-brand-wine)";
const BUTTER = "var(--color-brand-butter)";

const stripes = (a = WINE, b = BUTTER) => `repeating-linear-gradient(90deg, ${a} 0px, ${a} 32px, ${b} 32px, ${b} 64px)`;

/** Half-circle fringe below the stripes: each scallop continues the stripe color above it. */
const scallops = (r: number, a = WINE, b = BUTTER) =>
  `radial-gradient(circle at ${r}px 0px, ${a} ${r - 0.5}px, transparent ${r}px) 0px 0px / ${r * 4}px ${r}px repeat-x, ` +
  `radial-gradient(circle at ${r * 3}px 0px, ${b} ${r - 0.5}px, transparent ${r}px) 0px 0px / ${r * 4}px ${r}px repeat-x`;

/**
 * Awning band. `slope` adds the 84px 3D-tilted canopy used by the hanging site header.
 * `animate` plays the fabric unrolling animation (disabled by prefers-reduced-motion).
 */
export function Awning({ slope, animate, className }: { slope?: boolean; animate?: boolean; className?: string }) {
  return (
    <div aria-hidden className={`relative ${className ?? ""}`}>
      {slope && (
        <div
          className={`h-[84px] origin-bottom ${animate ? "animate-awning-slope" : ""}`}
          style={{
            transform: "perspective(420px) rotateX(46deg)",
            backgroundImage: `linear-gradient(180deg, rgb(42 26 23 / .4) 0px, rgb(42 26 23 / .12) 50%, rgb(255 255 255 / .1) 100%), ${stripes()}`,
          }}
        />
      )}
      <div
        className={`h-[18px] origin-top ${animate ? "animate-awning-flap [animation-delay:.85s]" : ""}`}
        style={{ backgroundImage: `linear-gradient(180deg, rgb(42 26 23 / .3) 0px, rgb(42 26 23 / 0) 5px), ${stripes()}` }}
      />
      <div
        className={`h-4 origin-top ${animate ? "animate-awning-flap [animation-delay:.95s]" : ""}`}
        style={{ background: scallops(16), filter: "drop-shadow(rgb(42 26 23 / .3) 0px 6px 5px)" }}
      />
    </div>
  );
}

/** 8px stripes + 8px fringe for the compact sticky bar. */
export function MiniAwning({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="h-2" style={{ backgroundImage: stripes() }} />
      <div className="h-2" style={{ background: scallops(8) }} />
    </div>
  );
}

/** Wine/butter divider strip (default 20px). */
export function StripeDivider({ height = 20, className }: { height?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{ height, backgroundImage: `repeating-linear-gradient(90deg, ${WINE} 0 ${height}px, ${BUTTER} ${height}px ${height * 2}px)` }}
    />
  );
}
