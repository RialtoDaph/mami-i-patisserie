import { ICON_PATHS, type IconName } from "./icons.generated";

export type { IconName };

/** Material Symbols Rounded icon as inline SVG. Decorative unless `label` is given. */
export function Icon({
  name,
  size = 20,
  label,
  className,
}: {
  name: IconName;
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill="currentColor"
      className={`inline-block shrink-0 ${className ?? ""}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
