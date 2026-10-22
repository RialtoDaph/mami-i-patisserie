import type { ComponentProps } from "react";

/**
 * Form controls. `web` = website checkout/cards (52px, radius 10px, wine focus ring);
 * `app` = internal app (48px, radius 6px). Font is always 16px so iOS does not zoom.
 */
export type FieldTone = "web" | "app";

const CONTROL: Record<FieldTone, string> = {
  web: "min-h-[52px] rounded-[10px] border-brand-espresso/20 px-4",
  app: "min-h-12 rounded-md border-line px-3",
};

export function controlClass(tone: FieldTone = "web", className?: string) {
  return [
    "block w-full min-w-0 border-[1.5px] bg-white text-base text-brand-espresso outline-none transition-[border-color,box-shadow]",
    "placeholder:text-brand-muted/70 focus:border-brand-wine focus:ring-3 focus:ring-brand-wine/12",
    "aria-invalid:border-brand-wine disabled:opacity-60",
    CONTROL[tone],
    className ?? "",
  ].join(" ");
}

export function Field({
  label,
  hint,
  error,
  tone = "web",
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  tone?: FieldTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-2 ${className ?? ""}`}>
      <span className={tone === "app" ? "text-[13px] font-bold text-brand-pistachio-deep" : "text-sm font-bold text-brand-espresso"}>
        {label}
        {hint && <span className="ml-1.5 font-normal text-brand-muted">{hint}</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="text-sm font-semibold text-brand-wine">
          {error}
        </span>
      )}
    </label>
  );
}

export function Input({ tone, className, ...rest }: { tone?: FieldTone } & ComponentProps<"input">) {
  return <input className={controlClass(tone, className)} {...rest} />;
}

export function Textarea({ tone, className, ...rest }: { tone?: FieldTone } & ComponentProps<"textarea">) {
  return <textarea className={controlClass(tone, `min-h-[120px] py-3.5 leading-normal resize-y ${className ?? ""}`)} {...rest} />;
}

export function Select({ tone, className, ...rest }: { tone?: FieldTone } & ComponentProps<"select">) {
  return <select className={controlClass(tone, `appearance-auto ${className ?? ""}`)} {...rest} />;
}
