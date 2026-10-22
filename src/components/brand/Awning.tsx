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

/** Compact canopy: stripes + fringe. Default 8px/8px; the sticky website bar uses 22px stripes with a 16px fringe. */
export function MiniAwning({ stripe = 8, fringe = 8, className }: { stripe?: number; fringe?: number; className?: string }) {
  const shade =
    stripe > 12 ? "linear-gradient(180deg, rgb(42 26 23 / .3) 0px, rgb(42 26 23 / 0) 8px, rgb(255 255 255 / .12) 12px, rgb(42 26 23 / .14) 20px), " : "";
  return (
    <span aria-hidden className={`block ${className ?? ""}`}>
      <span className="block" style={{ height: stripe, backgroundImage: shade + stripes() }} />
      <span className="block" style={{ height: fringe, background: scallops(fringe) }} />
    </span>
  );
}

/** Wine/butter divider strip: `height` tall, stripes `stripe` px wide (prototype: 20px, drawers 16px). */
export function StripeDivider({ height = 20, stripe = 20, light = "butter", className }: { height?: number; stripe?: number; light?: "butter" | "butter-50"; className?: string }) {
  const b = light === "butter" ? BUTTER : "var(--color-brand-butter-50)";
  return (
    <div
      aria-hidden
      className={className}
      style={{ height, backgroundImage: `repeating-linear-gradient(90deg, ${WINE} 0 ${stripe}px, ${b} ${stripe}px ${stripe * 2}px)` }}
    />
  );
}
