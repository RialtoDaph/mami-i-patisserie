"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { buttonClass, Icon, Input, Textarea, type IconName } from "@/components/brand";
import { useCart } from "@/components/site/CartProvider";
import { QtyStepper } from "@/components/site/SiteOverlays";
import { NATAL_2026 } from "@/content/campaigns";
import { NATAL_PRODUCT_IDS, PRICES_ARE_SAMPLE, productById } from "@/content/catalog";
import { site } from "@/content/site";
import { DELIVERY_AREAS, PICKUP_SLOTS, SHIPPING_IS_SAMPLE, type DeliveryMethod } from "@/content/shipping";
import { formatDateId, todayJakarta } from "@/lib/preorder/dates";
import { formatRupiah } from "@/lib/format";
import { lineKey } from "@/lib/site/cart";
import { dateBounds, dpAmount, payNow, subtotal, validateDetails, type CheckoutDetails, type DetailErrors, type PayPlan } from "@/lib/site/checkout";
import { placeWebOrder } from "@/lib/site/orderActions";
import { waLink } from "@/lib/site/wa";

export interface CheckoutConfig {
  modeNatal: boolean;
  dpPercent: number;
  dpRound: number;
  minLeadDays: number;
  natalLeft: number;
}

const CARD = "bg-white shadow-[0_1px_0_rgb(62_39_35/.08),0_10px_24px_rgb(62_39_35/.07)]";
const H2 = "font-display text-2xl font-bold";
const pick = (on: boolean) => (on ? "border-2 border-brand-wine bg-white" : "border-[1.5px] border-brand-espresso/20 bg-transparent");
const ERR = "text-[13px] font-semibold text-brand-wine";

const EMPTY: CheckoutDetails = { name: "", whatsapp: "", method: "ambil", area: "", address: "", date: "", slot: PICKUP_SLOTS[0], note: "" };

type Done = { ref: string; pay: string; wa: string; remaining: string; waHref: string | null };

export function CheckoutView({ config }: { config: CheckoutConfig }) {
  const { items, setQty, clear, ready } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [d, setD] = useState<CheckoutDetails>(EMPTY);
  const [tried, setTried] = useState(false);
  const [plan, setPlan] = useState<PayPlan>("dp");
  const [via, setVia] = useState<"qris" | "transfer">("qris");
  const [proof, setProof] = useState<{ url: string; name: string } | null>(null);
  const [proofErr, setProofErr] = useState("");
  const [tried3, setTried3] = useState(false);
  const [copied, setCopied] = useState<"rek" | "amt" | null>(null);
  const [submitErr, setSubmitErr] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [pending, startTransition] = useTransition();

  const natal = config.modeNatal;
  const lines = useMemo(
    () => items.flatMap((c) => {
      const p = productById(c.productId);
      return p ? [{ ...c, key: lineKey(c), p }] : [];
    }),
    [items],
  );
  const natalCount = lines.reduce((s, l) => s + (NATAL_PRODUCT_IDS.includes(l.productId) ? l.qty : 0), 0);
  const overQuota = natalCount > config.natalLeft;

  const bounds = dateBounds(todayJakarta(), config.minLeadDays, natal ? { from: NATAL_2026.fulfilFrom, to: NATAL_2026.fulfilTo } : undefined);
  const needAddress = d.method !== "ambil";
  const areas = d.method === "ambil" ? [] : DELIVERY_AREAS[d.method];
  const fee = d.method === "ambil" ? 0 : (areas.find((a) => a.area === d.area)?.fee ?? null);
  const errors: DetailErrors = validateDetails(d, bounds, fee);
  const sub = subtotal(lines.map((l) => ({ qty: l.qty, price: l.p.price })));
  const total = sub + (fee ?? 0);
  const dp = dpAmount(total, config.dpPercent, config.dpRound);
  const effPlan: PayPlan = dp < total ? plan : "lunas";
  const now = payNow(total, dp, effPlan);
  const remaining = total - now;

  const top = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const set = (p: Partial<CheckoutDetails>) => setD((x) => ({ ...x, ...p }));
  const onField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ [e.target.name]: e.target.value } as Partial<CheckoutDetails>);
  const copy = (text: string, k: "rek" | "amt") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(k);
    setTimeout(() => setCopied(null), 1800);
  };

  const methods: [DeliveryMethod, string, IconName, string][] = natal
    ? [
        ["ambil", "Ambil sendiri", "storefront", "Di dapur Mami I, Bandung. Gratis."],
        ["ekspedisi", "JNE", "local_shipping", "Dikirim lewat JNE · ongkir sesuai tujuan"],
      ]
    : [
        ["ambil", "Ambil sendiri", "storefront", "Di dapur Mami I, Bandung. Gratis."],
        ["instan", "Kirim instan", "moped", "Bandung & Cimahi · mulai Rp 15.000"],
        ["ekspedisi", "Ekspedisi", "local_shipping", "Luar kota · frozen & kue kering · mulai Rp 35.000"],
      ];
  const methodLabel = methods.find((m) => m[0] === d.method)?.[1] ?? "";

  async function onProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setProofErr("File harus berupa foto atau screenshot.");
    try {
      // Preview only in stage 2; stage 4 uploads the compressed photo to the payment-proofs bucket.
      const url = URL.createObjectURL(file);
      setProof({ url, name: file.name });
      setProofErr("");
    } catch {
      setProofErr("Foto tidak bisa dibuka. Coba file lain.");
    }
  }

  function submit() {
    if (!proof) return setTried3(true);
    setSubmitErr("");
    startTransition(async () => {
      const res = await placeWebOrder({ items: lines.map((l) => ({ productId: l.productId, qty: l.qty, note: l.note })), details: d, plan: effPlan, via });
      if (!res.ok) return setSubmitErr(res.error);
      const viaLabel = via === "qris" ? "QRIS" : `transfer ${site.payment.bank}`;
      const msg = [
        "Halo Mami I Patisserie, saya sudah pesan di website.",
        `No. pesanan: ${res.ref}`,
        `Nama: ${d.name.trim()}`,
        `Total: ${formatRupiah(total)}`,
        `Sudah bayar ${effPlan === "lunas" ? "lunas" : "DP"} ${formatRupiah(res.payNow)} via ${viaLabel}, bukti sudah diupload.`,
        "Terima kasih!",
      ].join("\n");
      setDone({ ref: res.ref, pay: `${formatRupiah(res.payNow)} via ${viaLabel}`, wa: d.whatsapp, remaining: res.remaining > 0 ? formatRupiah(res.remaining) : "", waHref: waLink(msg) });
      clear();
      setStep(1);
      setD(EMPTY);
      setProof(null);
      top();
    });
  }

  const stepNames = ["Keranjang", "Data & pengiriman", "Bayar"];

  return (
    <div data-page="keranjang">
      <section className="px-page bg-brand-butter pt-10 pb-[clamp(48px,7vw,72px)]">
        <div className="flex flex-col gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-brand-muted">
            <Link href="/" className="text-brand-muted">
              Beranda
            </Link>
            <Icon name="chevron_right" size={16} />
            <span className="font-semibold text-brand-espresso">Keranjang</span>
          </nav>
          <h1 className="font-display text-[clamp(38px,6vw,60px)] leading-[1.05] font-bold">Checkout</h1>
          {!done && (
            <ol className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
              {stepNames.map((label, i) => {
                const n = i + 1;
                const on = n <= step;
                return (
                  <li key={label} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={n >= step}
                      onClick={() => setStep(n as 1 | 2 | 3)}
                      aria-current={n === step ? "step" : undefined}
                      className="flex items-center gap-2.5 disabled:cursor-default"
                    >
                      <span className={`flex size-[34px] items-center justify-center rounded-full border-[1.5px] text-[15px] font-bold ${on ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso/30 text-brand-muted"}`}>
                        {n}
                      </span>
                      <span className={`text-[15px] font-bold ${n === step ? "text-brand-espresso" : "text-brand-muted"}`}>{label}</span>
                    </button>
                    {n < 3 && <span className="h-[1.5px] w-7 bg-brand-espresso/30" />}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <section className="px-page bg-brand-butter-50 pt-[clamp(32px,5vw,56px)] pb-[clamp(52px,8vw,88px)]">
        {done ? (
          <div className={`${CARD} mx-auto flex max-w-[620px] flex-col items-center gap-3.5 p-[clamp(28px,5vw,48px)] text-center`}>
            <Icon name="task_alt" size={52} className="text-brand-olive" />
            <span className="font-script text-[26px] text-brand-wine">terima kasih!</span>
            <h2 className="font-display text-[clamp(26px,4vw,34px)] leading-[1.15] font-bold text-balance">Pesanan {done.ref} sudah kami terima</h2>
            <p className="max-w-[460px] text-[17px] leading-[1.6] text-pretty text-brand-muted">
              Bukti bayar {done.pay} sedang dicek admin. Konfirmasi dikirim ke WhatsApp {done.wa}, biasanya kurang dari 2 jam selama jam buka (10.00–17.00).
            </p>
            {done.remaining && <p className="text-base leading-normal font-semibold">Sisa {done.remaining} dibayar saat ambil, atau sebelum pesanan dikirim.</p>}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {done.waHref && (
                <a href={done.waHref} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "outline" })}>
                  <Icon name="chat" /> Kabari admin via WhatsApp
                </a>
              )}
              <Link href="/menu" className={buttonClass()}>
                Kembali ke menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-[clamp(24px,4vw,40px)]">
            <div className="flex min-w-0 flex-col gap-5 wide:col-span-2">
              {step === 1 && (
                <>
                  {overQuota && (
                    <div role="alert" className="bg-brand-wine-50 px-[18px] py-3.5 text-[15px] font-bold text-brand-wine">
                      Sisa kuota hampers Natal tinggal {config.natalLeft} box. Kurangi jumlah di keranjang.
                    </div>
                  )}
                  {ready && lines.length === 0 && (
                    <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
                      <Icon name="shopping_bag" size={48} className="text-brand-pistachio" />
                      <span className="font-script text-[26px] text-brand-wine">keranjang masih kosong</span>
                      <span className="text-base text-brand-muted">Pilih pastry atau hampers favorit dulu, ya.</span>
                      <div className="mt-1.5 flex flex-wrap justify-center gap-3">
                        <Link href={natal ? "/#paket" : "/menu"} className={buttonClass()}>
                          Lihat menu
                        </Link>
                        <Link href={natal ? "/#paket" : "/hampers"} className={buttonClass({ variant: "outline" })}>
                          Hampers
                        </Link>
                        {natal && (
                          <Link href="/#cara" className={buttonClass({ variant: "outline" })}>
                            Cara pesan
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                  {lines.map((l) => (
                    <div key={l.key} className={`${CARD} grid grid-cols-[clamp(72px,16vw,104px)_minmax(0,1fr)] items-center gap-4 p-3.5`}>
                      <div className="photo-slot relative aspect-square overflow-hidden">
                        {l.p.img && <Image src={l.p.img} alt={l.p.name} fill sizes="104px" className="object-cover" />}
                      </div>
                      <div className="flex min-w-0 flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display text-lg leading-tight font-bold">{l.p.name}</span>
                          <button type="button" onClick={() => setQty(l.key, 0)} aria-label="Hapus" className="flex size-10 flex-none items-center justify-center rounded-full text-brand-muted hover:bg-brand-butter-100">
                            <Icon name="delete" size={20} />
                          </button>
                        </div>
                        {l.note && (
                          <div className="flex items-start gap-2 bg-brand-butter-100 px-2.5 py-2 text-sm leading-snug">
                            <Icon name="mail" size={18} className="text-brand-wine" />
                            <span className="font-script text-base">{l.note}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <QtyStepper qty={l.qty} onChange={(q) => setQty(l.key, q)} />
                          <div className="flex flex-col items-end gap-0.5">
                            <b className="text-[17px] tabular-nums">{formatRupiah(l.p.price * l.qty)}</b>
                            <span className="text-[13px] text-brand-muted">{formatRupiah(l.p.price)} / item</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {lines.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={natal ? "/#paket" : "/menu"} className="border-b-[1.5px] border-brand-espresso pb-[3px] font-bold text-brand-espresso">
                        + Tambah produk lain
                      </Link>
                      <button
                        type="button"
                        disabled={overQuota}
                        onClick={() => {
                          setStep(2);
                          top();
                        }}
                        className={buttonClass()}
                      >
                        Lanjut isi data <Icon name="arrow_forward" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <div className={`${CARD} flex flex-col gap-5 p-[clamp(20px,4vw,32px)]`}>
                    <h2 className={H2}>Data pemesan</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
                        Nama
                        <Input name="name" autoComplete="name" value={d.name} onChange={onField} aria-invalid={tried && !!errors.name} />
                        {tried && errors.name && <span className={ERR}>Nama belum diisi</span>}
                      </label>
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
                        Nomor WhatsApp
                        <Input name="whatsapp" inputMode="tel" autoComplete="tel" placeholder="08…" value={d.whatsapp} onChange={onField} aria-invalid={tried && !!errors.whatsapp} />
                        {tried && errors.whatsapp && <span className={ERR}>Nomor WhatsApp belum benar</span>}
                      </label>
                    </div>

                    <h2 className={`${H2} mt-2`}>Pengiriman</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-3">
                      {methods.map(([m, label, icon, subText]) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={d.method === m}
                          onClick={() => set({ method: m, area: d.method === m ? d.area : "" })}
                          className={`flex flex-col gap-1.5 rounded-[10px] p-4 text-left ${pick(d.method === m)}`}
                        >
                          <Icon name={icon} size={26} className="text-brand-wine" />
                          <span className="text-base font-bold">{label}</span>
                          <span className="text-[13px] leading-snug text-brand-muted">{subText}</span>
                        </button>
                      ))}
                    </div>

                    {needAddress && (
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-bold">{d.method === "ekspedisi" ? "Tujuan ekspedisi" : "Area pengiriman"}</span>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))] gap-2.5">
                          {areas.map((a) => (
                            <button
                              key={a.area}
                              type="button"
                              aria-pressed={d.area === a.area}
                              onClick={() => set({ area: a.area })}
                              className={`flex flex-col gap-1 rounded-[10px] px-4 py-3.5 text-left ${pick(d.area === a.area)}`}
                            >
                              <span className="text-[15px] font-bold">{a.area}</span>
                              <span className="text-sm text-brand-muted tabular-nums">Ongkir {formatRupiah(a.fee)}</span>
                            </button>
                          ))}
                        </div>
                        {tried && errors.area && <span className={ERR}>Pilih area pengiriman</span>}
                        <span className="text-[13px] text-brand-muted">
                          Tarif tetap per area. Di luar daftar ini, chat admin dulu via WhatsApp.{SHIPPING_IS_SAMPLE ? " (Tarif masih contoh.)" : ""}
                        </span>
                      </div>
                    )}

                    {needAddress && (
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
                        Alamat lengkap
                        <Textarea name="address" rows={3} autoComplete="street-address" value={d.address} onChange={onField} className="min-h-24" aria-invalid={tried && !!errors.address} />
                        {tried && errors.address && <span className={ERR}>Alamat belum diisi</span>}
                      </label>
                    )}

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] items-start gap-4">
                      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
                        Tanggal {needAddress ? "kirim" : "ambil"}
                        <Input name="date" type="date" min={bounds.min} max={bounds.max ?? undefined} value={d.date} onChange={onField} aria-invalid={tried && !!errors.date} />
                        {tried && errors.date && (
                          <span className={ERR}>{bounds.max ? `Pilih tanggal ${formatDateId(bounds.min, false)} – ${formatDateId(bounds.max, false)}` : "Pilih tanggal, minimal 2 hari dari sekarang"}</span>
                        )}
                      </label>
                      {!needAddress && (
                        <div className="flex min-w-0 flex-col gap-2 text-sm font-bold">
                          <span>Jam ambil</span>
                          <div className="flex flex-wrap gap-2">
                            {PICKUP_SLOTS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                aria-pressed={d.slot === s}
                                onClick={() => set({ slot: s })}
                                className={`min-h-11 rounded-full border-[1.5px] px-[18px] text-[15px] font-bold whitespace-nowrap ${d.slot === s ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso/30"}`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
                      <span>
                        Catatan <span className="font-normal text-brand-muted">(opsional)</span>
                      </span>
                      <Input name="note" value={d.note} onChange={onField} placeholder="mis. tanpa kacang, patokan rumah" />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        top();
                      }}
                      className={buttonClass({ variant: "outline" })}
                    >
                      <Icon name="arrow_back" /> Keranjang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (Object.keys(errors).length || overQuota) return setTried(true);
                        setStep(3);
                        top();
                      }}
                      className={buttonClass()}
                    >
                      Lanjut ke pembayaran <Icon name="arrow_forward" />
                    </button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className={`${CARD} flex flex-col gap-1.5 p-[clamp(20px,4vw,32px)]`}>
                    <div className="flex items-baseline justify-between gap-3 pb-2.5">
                      <h2 className={H2}>Cek pesanan</h2>
                      <button type="button" onClick={() => setStep(2)} className="min-h-10 text-[15px] font-bold text-brand-wine">
                        Ubah data
                      </button>
                    </div>
                    {(
                      [
                        ["Nama", d.name],
                        ["WhatsApp", d.whatsapp],
                        ["Metode", methodLabel + (needAddress && d.area ? ` · ${d.area}` : "")],
                        ...(needAddress ? [["Alamat", d.address]] : []),
                        ["Tanggal", formatDateId(d.date) + (needAddress ? "" : `, jam ${d.slot}`)],
                        ...(d.note ? [["Catatan", d.note]] : []),
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 border-t border-brand-espresso/10 py-2.5 text-base">
                        <span className="text-brand-muted">{k}</span>
                        <span className="font-semibold [overflow-wrap:anywhere]">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`${CARD} flex flex-col gap-[18px] p-[clamp(20px,4vw,32px)]`}>
                    <h2 className={H2}>Mau bayar berapa sekarang?</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
                      {(dp < total ? (["dp", "lunas"] as const) : (["lunas"] as const)).map((k) => (
                        <button key={k} type="button" aria-pressed={effPlan === k} onClick={() => setPlan(k)} className={`flex flex-col gap-1 rounded-[10px] p-4 text-left ${pick(effPlan === k)}`}>
                          <span className="text-base font-bold">{k === "dp" ? `Bayar DP ${config.dpPercent}%` : "Bayar lunas"}</span>
                          <span className="font-display text-[22px] font-bold text-brand-wine tabular-nums">{formatRupiah(k === "dp" ? dp : total)}</span>
                          <span className="text-[13px] leading-snug text-brand-muted">{k === "dp" ? `Sisa ${formatRupiah(total - dp)} saat ambil atau sebelum kirim` : "Tidak ada tagihan lagi"}</span>
                        </button>
                      ))}
                    </div>

                    <h2 className={`${H2} mt-1.5`}>Bayar lewat</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
                      {(
                        [
                          ["qris", "QRIS", "qr_code_2", "Semua m-banking & e-wallet"],
                          ["transfer", `Transfer ${site.payment.bank}`, "account_balance", `a.n. ${site.payment.accountName}`],
                        ] as const
                      ).map(([k, label, icon, subText]) => (
                        <button key={k} type="button" aria-pressed={via === k} onClick={() => setVia(k)} className={`flex items-center gap-3 rounded-[10px] p-4 text-left ${pick(via === k)}`}>
                          <Icon name={icon} size={28} className="text-brand-wine" />
                          <span className="flex flex-col gap-0.5">
                            <span className="text-base font-bold">{label}</span>
                            <span className="text-[13px] text-brand-muted">{subText}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    {via === "qris" ? (
                      <div className="flex flex-wrap items-center gap-5 bg-brand-butter-100 p-[18px]">
                        <div className="flex size-[180px] flex-none flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-brand-espresso/35 bg-white p-3 text-center">
                          <Icon name="qr_code_2" size={56} />
                          <span className="text-xs leading-snug text-brand-muted">Gambar QRIS asli Mami I dipasang di sini</span>
                        </div>
                        <div className="flex flex-[1_1_220px] flex-col gap-2">
                          <span className="text-sm text-brand-muted">Scan pakai m-banking atau e-wallet apa pun, lalu bayar tepat:</span>
                          <span className="font-display text-[28px] font-bold tabular-nums">{formatRupiah(now)}</span>
                          <span className="text-sm text-brand-muted">Atas nama {site.payment.accountName}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col bg-brand-butter-100 px-[18px] py-1.5">
                        {(
                          [
                            ["Bank", site.payment.bank, null],
                            ["No. rekening", site.payment.accountNumber ?? "menyusul", site.payment.accountNumber ? "rek" : null],
                            ["Atas nama", site.payment.accountName, null],
                            ["Nominal", formatRupiah(now), "amt"],
                          ] as const
                        ).map(([k, v, c], i) => (
                          <div key={k} className={`grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-base ${i ? "border-t border-brand-espresso/12" : ""}`}>
                            <span className="text-brand-muted">{k}</span>
                            <b className={`tabular-nums ${k === "Nominal" ? "text-brand-wine" : ""}`}>{v}</b>
                            {c ? (
                              <button
                                type="button"
                                onClick={() => copy(c === "rek" ? site.payment.accountNumber! : String(now), c)}
                                className="min-h-10 rounded-full border-[1.5px] border-brand-espresso/30 bg-white px-3.5 text-sm font-bold"
                              >
                                {copied === c ? "Tersalin" : "Salin"}
                              </button>
                            ) : (
                              <span />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <h2 className={`${H2} mt-1.5`}>Upload bukti bayar</h2>
                    {!proof ? (
                      <label
                        className={`relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed bg-brand-butter-50 p-5 text-center hover:bg-brand-butter-100 ${
                          tried3 ? "border-brand-wine" : "border-brand-espresso/30"
                        }`}
                      >
                        <Icon name="upload" size={34} className="text-brand-wine" />
                        <span className="text-base font-bold">Pilih foto atau screenshot bukti</span>
                        <span className="text-[13px] text-brand-muted">JPG atau PNG dari galeri</span>
                        <input type="file" accept="image/*" onChange={onProof} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                      </label>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4 rounded-[10px] bg-brand-pistachio-50 p-3.5">
                        <div role="img" aria-label="Bukti bayar" className="h-[120px] w-24 flex-none rounded-md border border-brand-espresso/15 bg-white bg-cover bg-center" style={{ backgroundImage: `url(${proof.url})` }} />
                        <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-[15px] font-bold text-brand-olive">
                            <Icon name="check_circle" /> Bukti siap dikirim
                          </span>
                          <span className="text-[13px] [overflow-wrap:anywhere] text-brand-muted">{proof.name}</span>
                        </div>
                        <label className="relative flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] border-brand-espresso/30 bg-white px-4 text-sm font-bold">
                          Ganti
                          <input type="file" accept="image/*" onChange={onProof} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                        </label>
                      </div>
                    )}
                    {(proofErr || (tried3 && !proof)) && <span className="text-sm font-semibold text-brand-wine">{proofErr || "Upload bukti bayar dulu, ya."}</span>}
                    {submitErr && (
                      <span role="alert" className="text-sm font-semibold text-brand-wine">
                        {submitErr}
                      </span>
                    )}

                    <button type="button" onClick={submit} disabled={pending} className={buttonClass({ className: `min-h-[58px] text-[17px] ${proof ? "" : "opacity-55"}` })}>
                      <Icon name="lock" size={22} /> {pending ? "Mengirim…" : `Kirim pesanan · ${formatRupiah(now)}`}
                    </button>
                    <span className="text-center text-sm leading-normal text-brand-muted">Pesanan terkunci setelah admin mengecek bukti bayar. Konfirmasi dikirim via WhatsApp.</span>
                  </div>
                </>
              )}
            </div>

            <aside className={`${CARD} sticky top-[88px] flex flex-col gap-3.5 p-[clamp(20px,3vw,28px)]`}>
              <span className="font-display text-[21px] font-bold">Ringkasan</span>
              {lines.map((l) => (
                <div key={l.key} className="flex justify-between gap-3 text-[15px]">
                  <span>
                    {l.qty}× {l.p.name}
                  </span>
                  <span className="whitespace-nowrap tabular-nums">{formatRupiah(l.p.price * l.qty)}</span>
                </div>
              ))}
              <div className="flex flex-col gap-2 border-t-[1.5px] border-dashed border-brand-espresso/25 pt-3 text-[15px]">
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Subtotal</span>
                  <span className="tabular-nums">{formatRupiah(sub)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Ongkir</span>
                  <span className="tabular-nums">{needAddress ? (fee == null ? "pilih area" : formatRupiah(fee)) : "Gratis"}</span>
                </div>
                <div className="flex justify-between gap-3 pt-1.5 text-lg font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatRupiah(total)}</span>
                </div>
                {PRICES_ARE_SAMPLE && <span className="text-xs text-brand-muted">Harga masih contoh, belum final.</span>}
              </div>
              {step === 3 && (
                <div className="flex flex-col gap-1.5 bg-brand-butter-100 p-3.5 text-[15px]">
                  <div className="flex justify-between gap-3 font-bold text-brand-wine">
                    <span>Bayar sekarang</span>
                    <span className="tabular-nums">{formatRupiah(now)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-brand-muted">
                    <span>Sisa saat ambil/kirim</span>
                    <span className="tabular-nums">{formatRupiah(remaining)}</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2.5 text-sm leading-normal text-brand-muted">
                <span className="flex gap-2">
                  <Icon name="lock" size={18} /> Bayar DP {config.dpPercent}% atau lunas, pilih di langkah Bayar.
                </span>
                <span className="flex gap-2">
                  <Icon name="qr_code_2" size={18} /> QRIS atau transfer {site.payment.bank}, lalu upload bukti.
                </span>
                <span className="flex gap-2">
                  <Icon name="local_shipping" size={18} /> Ongkir tarif tetap per area.
                </span>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
