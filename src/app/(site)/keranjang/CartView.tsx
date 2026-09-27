"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/content/site";
import { formatRupiah } from "@/lib/format";
import { formatDateId, todayJakarta } from "@/lib/preorder/dates";
import { lineKey } from "@/lib/site/cart";
import { buildWhatsAppOrderMessage, earliestOrderDate, whatsAppUrl, type DeliveryChoice } from "@/lib/site/orderMessage";
import { useCart } from "@/components/site/CartProvider";

export function CartView() {
  const cart = useCart();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [delivery, setDelivery] = useState<DeliveryChoice>("ambil");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  if (!cart.ready) return <div className="mx-auto max-w-2xl px-4 py-10" />;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold">Keranjang masih kosong</h1>
        <p className="mt-2 text-brand-muted">Yuk pilih kue favorit Anda dulu.</p>
        <Link href="/katalog" className="btn-wine mt-6">Lihat Menu</Link>
      </div>
    );
  }

  const earliest = earliestOrderDate(cart.items, todayJakarta());
  const validDate = date && date >= earliest ? date : null;
  const message = buildWhatsAppOrderMessage({ cart: cart.items, date: validDate, name, delivery, notes }, site.name);
  const href = whatsAppUrl(site.whatsapp, message);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 font-display text-4xl font-semibold">Keranjang</h1>

      <ul className="mb-6 flex flex-col divide-y divide-brand-espresso/10 rounded-3xl bg-brand-butter-soft px-4 ring-1 ring-brand-espresso/10">
        {cart.items.map((i) => {
          const key = lineKey(i);
          return (
            <li key={key} className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{i.name}</p>
                {i.campaignName && <p className="text-xs font-semibold text-brand-pistachio-deep">{i.campaignName}</p>}
                <p className="text-sm text-brand-muted">{formatRupiah(i.unitPrice)} · <b>{formatRupiah(i.qty * i.unitPrice)}</b></p>
              </div>
              <div className="flex items-center rounded-full border border-brand-espresso/30 bg-brand-cream">
                <button type="button" aria-label={`Kurangi ${i.name}`} onClick={() => cart.setQty(key, i.qty - 1)} className="size-11 text-xl font-bold text-brand-muted">−</button>
                <span className="w-6 text-center font-semibold tabular-nums">{i.qty}</span>
                <button type="button" aria-label={`Tambah ${i.name}`} onClick={() => cart.setQty(key, i.qty + 1)} className="size-11 text-xl font-bold text-brand-muted">+</button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mb-8 flex items-baseline justify-between rounded-3xl bg-brand-butter px-5 py-4">
        <span className="font-semibold">Total ({cart.count} item)</span>
        <span className="font-display text-3xl font-semibold">{formatRupiah(cart.total)}</span>
      </p>

      <div className="mb-8 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-muted">Tanggal diinginkan</span>
          <input type="date" value={date} min={earliest} onChange={(e) => setDate(e.target.value)} className="min-h-12 w-full rounded-2xl border border-brand-espresso/20 bg-brand-cream px-3" />
          <span className="mt-1 block text-sm text-brand-muted">Paling cepat {formatDateId(earliest)}. Kosongkan kalau fleksibel.</span>
        </label>
        <div>
          <span className="mb-1 block text-sm font-semibold text-brand-muted">Pengambilan</span>
          <div className="grid grid-cols-2 gap-2">
            {(["ambil", "kirim"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDelivery(d)}
                className={`min-h-12 rounded-full border font-semibold ${delivery === d ? "border-brand-espresso bg-brand-espresso text-brand-butter" : "border-brand-espresso/30 bg-brand-cream text-brand-muted"}`}>
                {d === "ambil" ? "Ambil sendiri" : "Dikirim"}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-muted">Nama (opsional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="min-h-12 w-full rounded-2xl border border-brand-espresso/20 bg-brand-cream px-3" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-brand-muted">Catatan (opsional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-2xl border border-brand-espresso/20 bg-brand-cream px-3 py-2" placeholder="mis. untuk hadiah, kartu ucapan…" />
        </label>
      </div>

      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => setSent(true)} className="btn-wine w-full text-lg">
          💬 Pesan via WhatsApp
        </a>
      ) : (
        <p className="rounded-2xl bg-brand-butter-soft p-4 text-sm">Nomor WhatsApp belum diatur (NEXT_PUBLIC_WHATSAPP_NUMBER).</p>
      )}
      <p className="mt-3 text-center text-sm text-brand-muted">Harga final, ongkir, dan tanggal akan dikonfirmasi admin.</p>

      {sent && (
        <div className="mt-6 rounded-3xl bg-brand-pistachio-soft p-5 text-center">
          <p className="font-semibold">Sudah terkirim ke WhatsApp?</p>
          <button type="button" onClick={() => { cart.clear(); setSent(false); }} className="btn-outline mt-3">Kosongkan keranjang</button>
        </div>
      )}
    </div>
  );
}
