"use client";

import Image from "next/image";
import { useState } from "react";
import { Eyebrow, PostCard } from "@/components/brand";
import { formatRupiah } from "@/lib/format";
import { cardNote } from "@/lib/site/cart";
import type { WebProduct } from "@/lib/site/types";
import { AddButton } from "../bits";
import { WaButton } from "../ui";

const field = "h-12 min-w-0 font-normal border-[1.5px] border-brand-espresso/30 bg-white px-3.5 text-base outline-none focus:border-brand-wine";

/** Optional greeting card + the three Christmas packages. The card text rides along with the package added. */
export interface NatalPackage {
  product: WebProduct;
  toples: number;
  zoom: number;
  origin: string;
}

export function NatalPackages({ packages, open, closedMsg }: { packages: NatalPackage[]; open: boolean; closedMsg: string }) {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [msg, setMsg] = useState("Selamat Natal! Semoga hangat dan manis di rumahmu.");
  const note = cardNote({ to, msg, from });

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] items-start gap-4 bg-white p-[clamp(18px,3vw,28px)] shadow-[0_1px_0_rgb(62_39_35/.08),0_10px_24px_rgb(62_39_35/.07)]">
        <p className="col-span-full font-display text-[19px] font-bold">
          Kartu ucapan <span className="text-[15px] font-normal text-brand-muted">· opsional, ikut ke paket yang kamu tambahkan</span>
        </p>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
          Untuk
          <input value={to} onChange={(e) => setTo(e.target.value.slice(0, 50))} placeholder="mis. Tante Rina" className={field} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-bold">
          Dari
          <input value={from} onChange={(e) => setFrom(e.target.value.slice(0, 40))} placeholder="namamu" className={field} />
        </label>
        <label className="col-span-full flex min-w-0 flex-col gap-2 text-sm font-bold">
          <span className="flex items-baseline gap-1.5">
            Pesan <span className="font-normal text-brand-muted">{msg.length}/180</span>
          </span>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 180))} rows={3} className={`${field} h-auto resize-y py-3`} />
        </label>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-6">
        {packages.map((pkg) => {
          const p = pkg.product;
          return (
            <PostCard key={p.id} data-tilt="card" className="relative flex flex-col gap-4 p-4 transition-shadow duration-200 hover:shadow-postcard-hover">
              <span data-glare aria-hidden className="pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-300" />
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-butter-100">
                <Image
                  src={p.img ?? "/images/hampers-kue-kering.jpg"}
                  alt={p.name}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                  className="object-cover"
                  style={{ transform: `scale(${pkg.zoom})`, transformOrigin: pkg.origin }}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 px-2">
                <Eyebrow className="tracking-[.2em] text-brand-natal">{pkg.toples} toples</Eyebrow>
                <h3 className="font-display text-2xl leading-[1.1] font-bold">{p.name}</h3>
                <span className="text-[15px] text-brand-muted">{p.desc}</span>
                <ul className="mt-2 flex flex-col gap-1.5 text-[15px]">
                  {[
                    [pkg.toples, "Toples kue kering resep Mami"],
                    [1, "Box hampers Natal + pita satin"],
                    [1, "Kartu ucapan tulis tangan"],
                  ].map(([q, n]) => (
                    <li key={n} className="flex gap-2.5">
                      <b className="min-w-5 text-brand-wine">{q}×</b>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 px-2 pb-2">
                <b className="font-display text-[26px]">{formatRupiah(p.price)}</b>
                {open ? (
                  <AddButton productId={p.id} note={note} label="Tambah ke keranjang" icon={null} size="lg" block />
                ) : (
                  <span className="flex min-h-[52px] items-center justify-center rounded-full bg-brand-espresso/12 px-3 text-center text-[15px] font-bold">{closedMsg}</span>
                )}
              </div>
            </PostCard>
          );
        })}
      </div>
      {!open && (
        <WaButton
          text="Halo Mami I Patisserie, kuota hampers Natal sudah habis. Saya mau masuk daftar tunggu."
          className="inline-flex min-h-[52px] items-center self-start rounded-full bg-brand-natal px-6 font-bold text-brand-butter"
        >
          Chat admin
        </WaButton>
      )}
    </>
  );
}
