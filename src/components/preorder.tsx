import { PAYMENT_STATUS_LABEL, STATUS_LABEL, type OrderStatus, type PaymentStatus } from "@/lib/preorder";

const STATUS_CLASS: Record<OrderStatus, string> = {
  baru: "bg-sky-100 text-sky-800",
  menunggu_dp: "bg-amber-100 text-amber-800",
  dp_diterima: "bg-emerald-100 text-emerald-800",
  diproduksi: "bg-violet-100 text-violet-800",
  siap: "bg-lime-100 text-lime-800",
  dikirim: "bg-indigo-100 text-indigo-800",
  selesai: "bg-black/5 text-muted",
  batal: "bg-bad-bg text-bad line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

const PAY_CLASS: Record<PaymentStatus, string> = {
  belum_bayar: "text-bad",
  dp_kurang: "text-amber-700",
  dp_ok: "text-emerald-700",
  lunas: "text-ok",
  lebih_bayar: "text-violet-700",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`text-xs font-bold ${PAY_CLASS[status]}`}>{PAYMENT_STATUS_LABEL[status]}</span>;
}

export function RepeatBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]">
      💬 {label}
    </a>
  );
}
