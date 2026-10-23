/** Wordmark: "Mami I" (Libre Baskerville italic, I in wine) + "— PATISSERIE —". */
export function Logo({ size = "md", tone = "butter", className }: { size?: "sm" | "md"; tone?: "butter" | "espresso"; className?: string }) {
  const text = tone === "butter" ? "text-brand-butter" : "text-brand-espresso";
  const rule = tone === "butter" ? "bg-brand-butter" : "bg-brand-espresso";
  return (
    <span className={`inline-flex flex-col items-center gap-2 leading-none whitespace-nowrap ${text} ${className ?? ""}`}>
      <span className={`font-display italic ${size === "sm" ? "text-2xl" : "text-[clamp(22px,2.8vw,30px)]"}`}>
        Mami <span className="font-bold text-brand-wine not-italic">I</span>
      </span>
      {size === "md" && (
        <span className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[.5em]">
          <span className={`h-px w-[18px] ${rule}`} />
          <span className="-mr-[.5em]">PATISSERIE</span>
          <span className={`h-px w-[18px] ${rule}`} />
        </span>
      )}
    </span>
  );
}
