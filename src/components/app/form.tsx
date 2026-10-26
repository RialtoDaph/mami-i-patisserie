"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

// Form pieces for the internal app (prototype "App Internal v2"): white inputs with 1.5px lines, small olive labels.

export const inputClass =
  "block min-h-12 w-full min-w-0 rounded-md border-[1.5px] border-brand-espresso/18 bg-white px-3 text-base outline-none focus:border-brand-wine";

export function AppField({ label, hint, className, children }: { label: React.ReactNode; hint?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-[13px] font-bold text-brand-pistachio-deep">{label}</span>
      {children}
      {hint && <span className="text-xs text-brand-muted">{hint}</span>}
    </label>
  );
}

/** Number input that shows dot thousands separators while typing ("2.000.000"); the form receives the digits. */
export function NumberInput({
  name, defaultValue, placeholder, onValue, max, required, className,
}: {
  name: string;
  defaultValue?: number | null;
  placeholder?: string;
  onValue?: (n: number | null) => void;
  max?: number;
  required?: boolean;
  className?: string;
}) {
  const [text, setText] = useState(defaultValue != null ? formatNumber(defaultValue) : "");
  return (
    <input
      name={name}
      inputMode="numeric"
      autoComplete="off"
      required={required}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
        const n = digits ? Math.min(Number(digits), max ?? Number.MAX_SAFE_INTEGER) : null;
        setText(n == null ? "" : formatNumber(n));
        onValue?.(n);
      }}
      className={`${inputClass} tabular-nums ${className ?? ""}`}
    />
  );
}

export function FormMessage({ error, ok }: { error?: string; ok?: string | null }) {
  if (error) return <p role="alert" className="text-sm font-semibold text-brand-wine">{error}</p>;
  if (ok) return <p role="status" className="rounded-md border-[1.5px] border-brand-pistachio bg-brand-pistachio-50 px-3 py-2 text-sm font-bold">{ok}</p>;
  return null;
}
