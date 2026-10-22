"use client";

import Image from "next/image";
import { useState } from "react";
import { Icon, Input, Textarea } from "@/components/brand";
import { HAMPERS_BOXES, productById } from "@/content/catalog";
import { formatRupiah } from "@/lib/format";
import { cardNote } from "@/lib/site/cart";
import { useCart } from "../CartProvider";
import { QtyStepper } from "../SiteOverlays";

const TEMPLATES = [
  ["Calon mertua", "Bawa martabak sudah biasa. Ini bingkisan spesial dari Mami I untuk Mami-Papi di rumah. Semoga suka!"],
  ["Lebaran", "Selamat Idul Fitri. Mohon maaf lahir dan batin, semoga hangatnya hari raya sampai ke rumah."],
  ["Terima kasih", "Terima kasih untuk semua kebaikannya. Sedikit manis dari dapur Mami, semoga suka."],
  ["Tulis sendiri", ""],
] as const;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-wine font-display text-lg font-bold text-brand-butter">{n}</span>
      <div className="flex min-w-0 flex-col gap-3.5 pt-2">
        <h3 className="font-display text-[22px] leading-[1.2] font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/** "Rangkai bingkisan": pick a box, write the card (Mami hand-writes it), preview, add to cart. */
export function HampersBuilder() {
  const { add } = useCart();
  const [sel, setSel] = useState<string>(HAMPERS_BOXES[0].productId);
  const [qty, setQty] = useState(1);
  const [tpl, setTpl] = useState(0);
  const [msg, setMsg] = useState<string>(TEMPLATES[0][1]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [cardOpen, setCardOpen] = useState(false);

  const box = HAMPERS_BOXES.find((b) => b.productId === sel)!;
  const product = productById(sel)!;
  const hover = () => window.matchMedia("(hover: hover)").matches;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(32px,5vw,56px)]">
      <div className="flex flex-col gap-9">
        <Step n={1} title="Pilih isinya">
          <div className="flex flex-col gap-3">
            {HAMPERS_BOXES.map((b) => {
              const p = productById(b.productId)!;
              const on = b.productId === sel;
              return (
                <button
                  key={b.productId}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSel(b.productId)}
                  className={`grid grid-cols-[clamp(84px,18vw,112px)_minmax(0,1fr)_auto] items-center gap-4 rounded-[10px] bg-white p-3 text-left transition-shadow duration-200 ${
                    on ? "border-2 border-brand-wine shadow-[0_12px_26px_rgb(170_25_69/.14)]" : "border-[1.5px] border-brand-espresso/15"
                  }`}
                >
                  <span className="relative block aspect-square overflow-hidden bg-brand-butter-100">
                    <Image src={p.img!} alt={p.name} fill sizes="112px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-script text-lg leading-[1.1] text-brand-wine">{b.sub}</span>
                    <span className="font-display text-lg leading-tight font-bold">{p.name}</span>
                    <span className="text-sm leading-snug text-brand-muted">{b.short}</span>
                    <b className="mt-0.5 text-[15px]">{formatRupiah(p.price)}</b>
                  </span>
                  <span className={`flex size-7 items-center justify-center rounded-full border-2 text-brand-butter ${on ? "border-brand-wine bg-brand-wine" : "border-brand-espresso/30"}`}>
                    <Icon name="check" size={18} />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5 bg-brand-butter-100 px-4 py-3.5">
            <span className="text-[13px] font-bold tracking-[.12em] text-brand-pistachio-deep uppercase">Isi {product.name}</span>
            {box.items.map(([q, n]) => (
              <span key={n} className="flex gap-2.5 text-[15px]">
                <b className="w-6 text-brand-wine">{q}×</b>
                {n}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-[15px] font-bold">Jumlah box</span>
            <QtyStepper qty={qty} min={1} onChange={setQty} />
          </div>
        </Step>

        <Step n={2} title="Tulis kartu ucapan">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(([label, text], i) => (
              <button
                key={label}
                type="button"
                aria-pressed={i === tpl}
                onClick={() => {
                  setTpl(i);
                  setMsg(text);
                }}
                className={`min-h-11 rounded-full border-[1.5px] px-4 text-sm font-bold whitespace-nowrap ${
                  i === tpl ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso/30 text-brand-espresso"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
            Pesan
            <Textarea
              rows={4}
              value={msg}
              placeholder="Tulis pesanmu di sini…"
              onChange={(e) => {
                setMsg(e.target.value.slice(0, 180));
                setTpl(3);
              }}
            />
            <span className="self-end text-[13px] font-semibold text-brand-muted">{msg.length}/180</span>
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
            Dari
            <Input value={from} onChange={(e) => setFrom(e.target.value.slice(0, 40))} placeholder="mis. Dimas & keluarga" />
          </label>
        </Step>

        <Step n={3} title="Untuk siapa?">
          <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
            <span>
              Nama penerima <span className="font-normal text-brand-muted">(opsional)</span>
            </span>
            <Input value={to} onChange={(e) => setTo(e.target.value.slice(0, 50))} placeholder="mis. Keluarga Bapak Hadi" />
          </label>
          <span className="text-sm leading-normal text-brand-muted">Alamat dan tanggal kirim diisi di halaman checkout.</span>
        </Step>
      </div>

      <aside className="sticky top-[88px] flex flex-col gap-[18px] bg-brand-butter-100 p-[clamp(20px,3vw,28px)]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-[22px] font-bold">Bingkisanmu</span>
          <span className="text-[13px] font-bold text-brand-pistachio-deep">pratinjau</span>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden bg-brand-butter">
          <Image src={product.img!} alt={product.name} fill sizes="(max-width: 760px) 90vw, 560px" className="object-cover" />
          <span className="absolute bottom-3 left-3 rounded-full bg-brand-wine px-3 py-1.5 text-[13px] font-bold text-brand-butter">
            {qty} × {product.name}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2.5 pt-[clamp(40px,7vw,72px)]">
          <button
            type="button"
            aria-label="Buka atau tutup kartu ucapan"
            aria-pressed={cardOpen}
            onClick={() => setCardOpen((v) => !v)}
            onMouseEnter={() => hover() && setCardOpen(true)}
            onMouseLeave={() => hover() && setCardOpen(false)}
            className="relative aspect-[7/5] w-[min(100%,380px)] cursor-pointer text-left [perspective:1400px]"
          >
            <div
              className="absolute inset-0 flex flex-col justify-between gap-2.5 bg-white p-[clamp(18px,3.5vw,28px)] shadow-[0_14px_30px_rgb(62_39_35/.16)]"
              style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 33px, rgb(62 39 35 / .08) 33px 34px)" }}
            >
              {to && <span className="font-script text-lg text-brand-pistachio-deep">Untuk {to},</span>}
              <p className="overflow-hidden font-script text-[clamp(17px,2.2vw,21px)] leading-normal text-pretty">{msg || "Tulis pesanmu di sebelah kiri…"}</p>
              <span className="self-end font-script text-[19px] text-brand-wine">{from ? `— ${from}` : ""}</span>
            </div>
            <div
              className="absolute inset-0 origin-top transition-transform duration-900 ease-(--ease-pop) [transform-style:preserve-3d]"
              style={{ transform: cardOpen ? "rotateX(118deg)" : "rotateX(0deg)" }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-wine text-brand-butter shadow-[0_14px_30px_rgb(62_39_35/.22)] [backface-visibility:hidden]">
                <span className="font-display text-[clamp(30px,4.5vw,40px)] leading-none italic">
                  Mami <span className="font-bold not-italic">I</span>
                </span>
                <span className="flex items-center gap-2.5 text-[10px] font-semibold tracking-[.5em]">
                  <span className="h-px w-5 bg-brand-butter" />
                  PATISSERIE
                  <span className="h-px w-5 bg-brand-butter" />
                </span>
              </div>
              <div className="absolute inset-0 bg-brand-butter [backface-visibility:hidden] [transform:rotateX(180deg)]" />
            </div>
          </button>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-muted">
            <Icon name="touch_app" size={18} /> {cardOpen ? "Ketuk untuk menutup kartu" : "Ketuk kartu untuk membuka"}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t-[1.5px] border-dashed border-brand-espresso/25 pt-3.5">
          <span className="text-[15px] text-brand-muted">Perkiraan</span>
          <span className="flex flex-col items-end gap-0.5">
            <b className="font-display text-2xl tabular-nums">{formatRupiah(product.price * qty)}</b>
            <span className="text-xs text-brand-muted">harga contoh · belum ongkir</span>
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => add(sel, { qty, note: cardNote({ to, msg, from }), origin: { x: e.clientX, y: e.clientY } })}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-wine px-7 font-bold text-brand-butter transition hover:brightness-[.92] active:scale-[.97]"
        >
          <Icon name="redeem" size={22} /> Masukkan ke keranjang
        </button>
      </aside>
    </div>
  );
}
