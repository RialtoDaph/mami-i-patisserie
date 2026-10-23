"use client";

import { useState } from "react";
import { Icon, Input, Textarea } from "@/components/brand";
import { normalizeWhatsapp } from "@/lib/preorder/phone";
import { waLink } from "@/lib/site/wa";

const TOPICS = ["Pesanan", "Hampers & corporate", "Kerja sama", "Lainnya"];

/** Contact form that opens a prefilled WhatsApp chat. */
export function ContactForm() {
  const [f, setF] = useState({ name: "", wa: "", topic: TOPICS[0], msg: "" });
  const [tried, setTried] = useState(false);
  const err = { name: !f.name.trim(), wa: !normalizeWhatsapp(f.wa), msg: !f.msg.trim() };
  const ok = !err.name && !err.wa && !err.msg;
  const href = waLink(`Halo Mami I Patisserie, saya ${f.name} (${f.wa}).\nTopik: ${f.topic}\n\n${f.msg}`);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
          Nama
          <Input name="name" autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={tried && err.name} />
          {tried && err.name && <span className="text-[13px] font-semibold text-brand-wine">Nama belum diisi</span>}
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
          Nomor WhatsApp
          <Input name="wa" inputMode="tel" autoComplete="tel" placeholder="08…" value={f.wa} onChange={set("wa")} aria-invalid={tried && err.wa} />
          {tried && err.wa && <span className="text-[13px] font-semibold text-brand-wine">Nomor belum benar</span>}
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">Topik</span>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={f.topic === t}
              onClick={() => setF({ ...f, topic: t })}
              className={`min-h-11 rounded-full border-[1.5px] px-[18px] text-[15px] font-bold whitespace-nowrap ${
                f.topic === t ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
        Pesan
        <Textarea name="msg" rows={5} value={f.msg} onChange={set("msg")} className="min-h-[140px]" aria-invalid={tried && err.msg} />
        {tried && err.msg && <span className="text-[13px] font-semibold text-brand-wine">Pesan belum diisi</span>}
      </label>
      <a
        href={href ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!ok || !href) {
            e.preventDefault();
            setTried(true);
          }
        }}
        className="inline-flex min-h-[52px] items-center gap-2 self-start rounded-full bg-brand-wine px-7 font-bold whitespace-nowrap text-brand-butter transition hover:brightness-[.92] active:scale-[.97]"
      >
        <Icon name="send" /> Kirim via WhatsApp
      </a>
      {tried && ok && !href && <span className="text-sm font-semibold text-brand-wine">Nomor WhatsApp admin belum tersedia. Coba lagi nanti, ya.</span>}
    </>
  );
}
