import { PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus, type PaymentStatus } from "@/lib/preorder";

const STATUS_CLASS: Record<OrderStatus, string> = {
  baru: "bg-brand-butter text-brand-espresso",
  menunggu_dp: "bg-brand-wine-soft text-brand-wine",
  dp_diterima: "bg-brand-pistachio-soft text-brand-espresso",
  diproduksi: "bg-brand-pistachio text-brand-espresso",
  siap: "bg-brand-espresso text-brand-butter",
  dikirim: "bg-brand-espresso/80 text-brand-butter",
  selesai: "bg-brand-espresso/5 text-muted",
  batal: "bg-bad-bg text-bad line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

const PAY_CLASS: Record<PaymentStatus, string> = {
  belum_bayar: "text-bad",
  dp_kurang: "text-bad",
  dp_ok: "text-ok",
  lunas: "text-ok",
  lebih_bayar: "text-brand-espresso",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`text-xs font-bold ${PAY_CLASS[status]}`}>{PAYMENT_STATUS_LABEL[status]}</span>;
}

export function RepeatBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className="ml-1 rounded bg-brand-pistachio px-1.5 py-0.5 text-[11px] font-bold text-brand-espresso">
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn w-full bg-brand-wine text-brand-butter hover:bg-brand-wine-dark">
      💬 {label}
    </a>
  );
}
