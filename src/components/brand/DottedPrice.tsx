import { formatRupiah } from "@/lib/format";

/**
 * Menu-board row: name …… price. A missing price shows "harga menyusul" in Kalam (prices are still pending).
 */
export function DottedPrice({
  name,
  price,
  nameClassName,
  className,
}: {
  name?: React.ReactNode;
  price: number | null | undefined;
  nameClassName?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-baseline gap-2.5 ${className ?? ""}`}>
      {name && <span className={nameClassName ?? "text-base font-semibold"}>{name}</span>}
      <span aria-hidden className="min-w-4 flex-1 -translate-y-1 border-b-2 border-dotted border-brand-espresso/35" />
      {price == null ? (
        <span className="font-script text-[17px] whitespace-nowrap text-brand-muted">harga menyusul</span>
      ) : (
        <span className="font-display text-[15px] font-bold whitespace-nowrap tabular-nums">{formatRupiah(price)}</span>
      )}
    </div>
  );
}
