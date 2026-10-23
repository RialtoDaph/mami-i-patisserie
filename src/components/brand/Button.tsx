import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant =
  | "wine" // primary CTA (wine fill, butter text)
  | "espresso"
  | "butter" // on dark/green backgrounds
  | "outline" // espresso outline on light backgrounds
  | "outline-light" // butter outline on dark backgrounds
  | "olive" // app: "Setujui"
  | "ghost";

/** pill = website CTA (radius 999px, min 52px); rect = internal app (radius 6px, min 48px). */
export type ButtonShape = "pill" | "rect";
export type ButtonSize = "lg" | "md" | "sm";

const VARIANT: Record<ButtonVariant, string> = {
  wine: "bg-brand-wine text-brand-butter",
  espresso: "bg-brand-espresso text-brand-butter",
  butter: "bg-brand-butter text-brand-espresso",
  outline: "border-[1.5px] border-brand-espresso text-brand-espresso bg-transparent",
  "outline-light": "border-[1.5px] border-brand-butter/55 text-brand-butter bg-transparent",
  olive: "bg-brand-olive text-brand-butter",
  ghost: "text-brand-espresso bg-transparent",
};

const SIZE: Record<ButtonShape, Record<ButtonSize, string>> = {
  pill: { lg: "min-h-[52px] px-7 text-base", md: "min-h-[46px] px-[18px] text-[15px]", sm: "min-h-11 px-4 text-sm" },
  rect: { lg: "min-h-14 px-6 text-base", md: "min-h-12 px-5 text-[15px]", sm: "min-h-11 px-3.5 text-sm" },
};

export function buttonClass({
  variant = "wine",
  shape = "pill",
  size = "lg",
  block,
  className,
}: { variant?: ButtonVariant; shape?: ButtonShape; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return [
    "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap select-none cursor-pointer",
    "transition-[transform,filter] duration-150 hover:brightness-[.93] active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-wine",
    shape === "pill" ? "rounded-full" : "rounded-md",
    SIZE[shape][size],
    VARIANT[variant],
    block ? "w-full" : "",
    className ?? "",
  ].join(" ");
}

type Common = { variant?: ButtonVariant; shape?: ButtonShape; size?: ButtonSize; block?: boolean; icon?: IconName };

export function Button({ variant, shape, size, block, icon, className, children, type = "button", ...rest }: Common & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass({ variant, shape, size, block, className })} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 18 : 20} />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, shape, size, block, icon, className, children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, shape, size, block, className })} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 18 : 20} />}
      {children}
    </Link>
  );
}

/** Round 44px icon button (menu, cart, close). */
export function IconButton({
  icon,
  label,
  tone = "outline",
  badge,
  className,
  ...rest
}: { icon: IconName; label: string; tone?: "outline" | "outline-light" | "wine" | "plain"; badge?: number } & ComponentProps<"button">) {
  const toneCls = {
    outline: "border-[1.5px] border-brand-espresso/25 text-brand-espresso",
    "outline-light": "border-[1.5px] border-brand-butter/40 text-brand-butter",
    wine: "bg-brand-wine text-brand-butter",
    plain: "text-current",
  }[tone];
  return (
    <button
      type="button"
      aria-label={label}
      className={`relative inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[transform,filter] hover:brightness-[.93] active:scale-[0.97] ${toneCls} ${className ?? ""}`}
      {...rest}
    >
      <Icon name={icon} size={22} />
      {badge != null && <CountBadge n={badge} />}
    </button>
  );
}

export function CountBadge({ n, tone = "butter" }: { n: number; tone?: "butter" | "wine" }) {
  return (
    <span
      className={`absolute -top-[5px] -right-[5px] flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-[5px] text-[11px] font-bold tabular-nums ${
        tone === "butter" ? "border-brand-espresso bg-brand-butter text-brand-wine" : "border-brand-butter-50 bg-brand-wine text-brand-butter"
      }`}
    >
      {n}
    </span>
  );
}
