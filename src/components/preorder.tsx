import { PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus, type PaymentStatus } from "@/lib/preorder";
import { Icon } from "@/components/brand";

// Prototype v2: butter for in-progress, pink for waiting on the customer, pistachio when ready.
const STATUS_CLASS: Record<OrderStatus, string> = {
  baru: "bg-brand-butter text-brand-espresso",
  menunggu_dp: "bg-brand-wine-soft text-brand-wine",
  dp_diterima: "bg-brand-butter text-brand-espresso",
  diproduksi: "bg-brand-pistachio-soft text-brand-espresso",
  siap: "bg-brand-pistachio text-brand-espresso",
  dikirim: "bg-brand-espresso/80 text-brand-butter",
  selesai: "bg-brand-espresso/5 text-muted",
  batal: "bg-bad-bg text-bad line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

const PAY_CLASS: Record<PaymentStatus, string> = {
  belum_bayar: "text-bad",
  dp_kurang: "text-bad",
  dp_ok: "text-brand-pistachio-deep",
  lunas: "text-brand-pistachio-deep",
  lebih_bayar: "text-brand-espresso",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`text-xs font-bold ${PAY_CLASS[status]}`}>{PAYMENT_STATUS_LABEL[status]}</span>;
}

export function RepeatBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className="ml-1.5 rounded bg-brand-pistachio px-1.5 py-0.5 align-[2px] font-sans text-[11px] font-bold whitespace-nowrap text-brand-espresso">
      Pelanggan lama · {count}x
    </span>
  );
}

export function ProductThumb({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
  if (!url) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-xl bg-crust text-xl"
      >
        🥐
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-xl object-cover" />;
}

export function WaButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center gap-3 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-4 text-[15px] font-bold hover:bg-brand-butter">
      <Icon name="chat" size={22} className="text-brand-wine" />
      <span className="flex-1">{label}</span>
      <Icon name="chevron_right" size={22} className="text-brand-muted" />
    </a>
  );
}
