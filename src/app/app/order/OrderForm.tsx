"use client";

import { useState, useTransition } from "react";
import {
  capacityFor, capacityViolations, dpPercentFor, earliestFulfillDate, formatDateId, normalizeWhatsapp,
  subtotalOf, suggestedDp, totalOf, unitPriceFor, validateOrderDraft,
  type Campaign, type Customer, type FulfillMethod, type Order, type Product, type Settings,
} from "@/lib/preorder";
import { saveOrder } from "@/lib/preorderActions";
import { formatNumber, formatRupiah, parseNumberInput } from "@/lib/format";
import { ErrorBox, Row } from "@/components/ui";
import { ProductThumb } from "@/components/preorder";

export interface OrderFormProduct extends Product {
  photoUrl: string | null;
}

export interface OrderFormProps {
  products: OrderFormProduct[];
  campaigns: Campaign[];
  customers: (Customer & { orderCount: number })[];
  orders: Order[];
  settings: Settings;
  today: string;
  initial: { order: Order; customer: Customer } | null;
  prefillCustomer: Customer | null;
}

const METHODS: { value: FulfillMethod; label: string }[] = [
  { value: "ambil", label: "Ambil sendiri" },
  { value: "kirim_instan", label: "Kirim instan" },
  { value: "ekspedisi", label: "Ekspedisi" },
];

const money = (s: string) => parseNumberInput(s) ?? 0;

export function OrderForm({ products, campaigns, customers, orders, settings, today, initial, prefillCustomer }: OrderFormProps) {
  const init = initial?.order;
  const startCustomer = initial?.customer ?? prefillCustomer;

  const [wa, setWa] = useState(startCustomer ? "0" + startCustomer.whatsapp.slice(2) : "");
  const [name, setName] = useState(startCustomer?.name ?? "");
  const [address, setAddress] = useState(startCustomer?.address ?? "");
  const [matchedId, setMatchedId] = useState<string | null>(startCustomer?.id ?? null);

  const [campaignId, setCampaignId] = useState<string | null>(init?.campaignId ?? null);
  const [date, setDate] = useState(init?.fulfillDate ?? "");
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries((init?.items ?? []).map((i) => [i.productId, i.qty])),
  );

  const [method, setMethod] = useState<FulfillMethod>(init?.fulfillMethod ?? "ambil");
  const [deliveryAddress, setDeliveryAddress] = useState(init?.deliveryAddress ?? startCustomer?.address ?? "");
  const [shipping, setShipping] = useState(init ? formatNumber(init.shippingFee) : "0");
  const [discount, setDiscount] = useState(init ? formatNumber(init.discount) : "0");
  const [dpText, setDpText] = useState(init ? formatNumber(init.dpAmount) : "");
  const [dpTouched, setDpTouched] = useState(Boolean(init));
  const [notes, setNotes] = useState(init?.notes ?? "");

  const [serverError, setServerError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [pending, start] = useTransition();

  // Customer lookup by WhatsApp number.
  const normalized = normalizeWhatsapp(wa);
  const match = normalized ? customers.find((c) => c.whatsapp === normalized) ?? null : null;
  const onWaChange = (value: string) => {
    setWa(value);
    const n = normalizeWhatsapp(value);
    const m = n ? customers.find((c) => c.whatsapp === n) : undefined;
    if (m && m.id !== matchedId) {
      setMatchedId(m.id);
      setName(m.name);
      setAddress(m.address ?? "");
      if (!deliveryAddress) setDeliveryAddress(m.address ?? "");
    } else if (!m) {
      setMatchedId(null);
    }
  };

  // Campaigns open today, plus the order's current campaign when editing.
  const campaignOptions = campaigns.filter(
    (c) => (c.isActive && today >= c.preorderOpen && today <= c.preorderClose) || c.id === init?.campaignId,
  );
  const campaign = campaigns.find((c) => c.id === campaignId) ?? null;
  const checkDates = !init || init.fulfillDate !== date || init.campaignId !== campaignId;

  const available = products.filter(
    (p) =>
      (p.isActive && p.preorderEnabled && (!campaign || campaign.products.some((cp) => cp.productId === p.id))) ||
      qty[p.id] > 0,
  );

  // Keep the original price of existing lines unless the campaign changed.
  const priceOf = (p: Product) => {
    const existing = init?.items.find((i) => i.productId === p.id);
    return existing && init?.campaignId === campaignId ? existing.unitPrice : unitPriceFor(p, campaign);
  };

  const items = available.filter((p) => qty[p.id] > 0).map((p) => ({ productId: p.id, qty: qty[p.id], unitPrice: priceOf(p) }));
  const subtotal = subtotalOf(items);
  const shippingFee = method === "ambil" ? 0 : money(shipping);
  const discountN = money(discount);
  const total = totalOf(subtotal, shippingFee, discountN);
  const dpPercent = dpPercentFor(campaign, settings);
  const dpSuggestion = suggestedDp(Math.max(total, 0), dpPercent);
  const dp = dpTouched ? money(dpText) : dpSuggestion;
  const earliest = earliestFulfillDate(items.length ? items.map((i) => i.productId) : available.map((p) => p.id), products, today);

  const draft = {
    items, fulfillDate: date, fulfillMethod: method, deliveryAddress, campaignId,
    shippingFee, discount: discountN, dpAmount: dp,
  };
  const errors = [
    ...(!normalized ? ["Nomor WhatsApp belum benar."] : []),
    ...(!name.trim() ? ["Nama pelanggan wajib diisi."] : []),
    ...validateOrderDraft(draft, { products, campaign, today, checkDates }),
    ...(date
      ? capacityViolations(items, date, products, orders, init?.id).map(
          (v) => `"${v.name}" PENUH minggu itu: sisa ${Math.max(0, v.capacity - v.used)}, diminta ${v.requested}.`,
        )
      : []),
  ];

  const setItemQty = (id: string, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, n) }));

  const submit = () => {
    setShowErrors(true);
    setServerError(null);
    if (errors.length) return;
    start(async () => {
      const res = await saveOrder({
        id: init?.id ?? null,
        customer: { whatsapp: wa, name, address, notes: "" },
        campaignId,
        fulfillDate: date,
        fulfillMethod: method,
        deliveryAddress,
        shippingFee,
        discount: discountN,
        dpAmount: dp,
        notes,
        items,
      });
      if (res?.error) setServerError(res.error);
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {/* 1. Customer */}
      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold text-cocoa">1. Pelanggan</h2>
        <label>
          <span className="field-label">Nomor WhatsApp</span>
          <input value={wa} onChange={(e) => onWaChange(e.target.value)} inputMode="tel" autoComplete="off" placeholder="0812-3456-7890" className="input" />
        </label>
        {match && (
          <p className="rounded-xl bg-ok-bg px-3 py-2 text-sm font-semibold text-ok">
            ✓ Pelanggan terdaftar
            {match.orderCount > 0 && ` · ini order ke-${match.orderCount + (init ? 0 : 1)}`}
            {match.orderCount >= (init ? 2 : 1) && " · Pelanggan lama"}
          </p>
        )}
        <label>
          <span className="field-label">Nama</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="mis. Bu Rina" />
        </label>
        <label>
          <span className="field-label">Alamat (opsional)</span>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input py-2" />
        </label>
      </section>

      {/* 2. Products & date */}
      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold text-cocoa">2. Produk & tanggal</h2>
        {campaignOptions.length > 0 && (
          <div>
            <span className="field-label">Campaign</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCampaignId(null)} className={campaignId === null ? "chip-on" : "chip-off"}>Tanpa campaign</button>
              {campaignOptions.map((c) => (
                <button key={c.id} type="button" onClick={() => setCampaignId(c.id)} className={campaignId === c.id ? "chip-on" : "chip-off"}>{c.name}</button>
              ))}
            </div>
          </div>
        )}
        <label>
          <span className="field-label">Tanggal ambil / kirim</span>
          <input
            type="date"
            value={date}
            min={checkDates ? (campaign?.fulfillStart && campaign.fulfillStart > earliest ? campaign.fulfillStart : earliest) : undefined}
            max={campaign?.fulfillEnd ?? undefined}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
          {date ? (
            <span className="mt-1 block text-sm text-muted">{formatDateId(date)}</span>
          ) : (
            <span className="mt-1 block text-sm text-muted">Paling cepat {formatDateId(earliest)}</span>
          )}
        </label>

        <ul className="flex flex-col divide-y divide-black/5">
          {available.map((p) => {
            const cap = date ? capacityFor(p, orders, date, init?.id) : null;
            const n = qty[p.id] ?? 0;
            const full = cap?.full && n === 0;
            const maxQty = cap?.remaining ?? Infinity;
            return (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <ProductThumb url={p.photoUrl} name={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{p.name}</p>
                  <p className="text-sm text-muted">
                    {formatRupiah(priceOf(p))}
                    {cap?.capacity != null && (
                      full ? (
                        <span className="ml-2 rounded bg-bad px-1.5 py-0.5 text-xs font-bold text-white">PENUH</span>
                      ) : (
                        <span className="ml-2 text-xs">sisa {Math.max(0, (cap.remaining ?? 0) - n)} minggu ini</span>
                      )
                    )}
                    {!date && p.weeklyCapacity != null && <span className="ml-2 text-xs">maks {p.weeklyCapacity}/minggu</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label={`Kurangi ${p.name}`} disabled={n === 0} onClick={() => setItemQty(p.id, n - 1)}
                    className="flex size-11 items-center justify-center rounded-xl border border-black/15 bg-white text-xl font-bold disabled:opacity-30">−</button>
                  <span className="w-8 text-center text-lg font-bold tabular-nums">{n}</span>
                  <button type="button" aria-label={`Tambah ${p.name}`} disabled={full || n >= maxQty} onClick={() => setItemQty(p.id, n + 1)}
                    className="flex size-11 items-center justify-center rounded-xl bg-cocoa text-xl font-bold text-white disabled:opacity-30">+</button>
                </div>
              </li>
            );
          })}
          {available.length === 0 && <li className="py-3 text-muted">Belum ada produk yang bisa dipreorder.</li>}
        </ul>
      </section>

      {/* 3. Delivery & payment */}
      <section className="card flex flex-col gap-3">
        <h2 className="text-lg font-bold text-cocoa">3. Kirim & bayar</h2>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button key={m.value} type="button" onClick={() => setMethod(m.value)} className={`${method === m.value ? "chip-on" : "chip-off"} px-2`}>
              {m.label}
            </button>
          ))}
        </div>
        {method !== "ambil" && (
          <>
            <label>
              <span className="field-label">Alamat kirim</span>
              <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} rows={2} className="input py-2" />
            </label>
            <label>
              <span className="field-label">Ongkir (Rp)</span>
              <input value={shipping} onChange={(e) => setShipping(e.target.value)} inputMode="numeric" className="input" />
            </label>
          </>
        )}
        <label>
          <span className="field-label">Diskon (Rp)</span>
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" className="input" />
        </label>

        <div className="rounded-xl bg-crust/60 px-4 py-2">
          <Row label="Subtotal" value={formatRupiah(subtotal)} />
          {shippingFee > 0 && <Row label="Ongkir" value={formatRupiah(shippingFee)} />}
          {discountN > 0 && <Row label="Diskon" value={`-${formatRupiah(discountN)}`} />}
          <Row label="Total" value={formatRupiah(total)} strong />
        </div>

        <label>
          <span className="field-label">DP yang diminta (Rp)</span>
          <input
            value={dpTouched ? dpText : formatNumber(dpSuggestion)}
            onChange={(e) => { setDpTouched(true); setDpText(e.target.value); }}
            inputMode="numeric"
            className="input"
          />
          <button type="button" onClick={() => { setDpTouched(false); setDpText(""); }} className="mt-1 text-sm font-semibold text-cocoa underline">
            Pakai saran {formatNumber(dpPercent, 2)}%: {formatRupiah(dpSuggestion)}
          </button>
        </label>
        <label>
          <span className="field-label">Catatan (opsional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input py-2" placeholder="mis. tanpa pedas, kartu ucapan untuk …" />
        </label>
      </section>

      {showErrors && errors.length > 0 && (
        <ul role="alert" className="rounded-xl border border-bad/30 bg-bad-bg p-3 text-sm font-semibold text-bad">
          {errors.map((e) => <li key={e}>• {e}</li>)}
        </ul>
      )}
      <ErrorBox message={serverError} />
      <div className="sticky bottom-20 z-10">
        <button type="submit" disabled={pending} className="btn-primary w-full shadow-lg">
          {pending ? "Menyimpan…" : `Simpan order · ${formatRupiah(total)}`}
        </button>
      </div>
    </form>
  );
}
