"use client";

import { useMemo, useState } from "react";
import { Icon, Script } from "@/components/brand";
import { Breadcrumb } from "../ui";
import { FAQ } from "./faqData";

const CATS = ["Semua", ...new Set(FAQ.map((d) => d.c))];

/** FAQ hero with search, then category chips + accordion. A search with ≤ 3 hits opens all of them. */
export function FaqView() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Semua");
  const [open, setOpen] = useState<Record<string, boolean>>({ "Bagaimana cara memesan?": true });
  const q = query.trim().toLowerCase();
  const list = useMemo(
    () => FAQ.filter((d) => (cat === "Semua" || d.c === cat) && (!q || `${d.q} ${d.a} ${d.c}`.toLowerCase().includes(q))),
    [cat, q],
  );

  return (
    <>
      <section className="px-page bg-brand-butter pt-10 pb-[clamp(48px,7vw,72px)]">
        <div className="mx-auto flex max-w-[820px] flex-col gap-[18px]">
          <Breadcrumb current="FAQ" />
          <Script tilt={0}>tanya Mami</Script>
          <h1 className="font-display text-[clamp(38px,6vw,60px)] leading-[1.05] font-bold text-balance">Pertanyaan yang sering ditanya</h1>
      <label className="flex min-h-14 items-center gap-2.5 rounded-full border-[1.5px] border-brand-espresso/20 bg-white px-[18px] focus-within:border-brand-wine">
        <Icon name="search" size={22} className="text-brand-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari: DP, ongkir, frozen, Lebaran…"
          aria-label="Cari pertanyaan"
          className="min-w-0 flex-1 bg-transparent text-base outline-none"
        />
      </label>
        </div>
      </section>
      <FaqBody cat={cat} setCat={setCat} list={list} q={q} open={open} setOpen={setOpen} clear={() => (setQuery(""), setCat("Semua"))} />
    </>
  );
}

function FaqBody({
  cat,
  setCat,
  list,
  q,
  open,
  setOpen,
  clear,
}: {
  cat: string;
  setCat: (c: string) => void;
  list: typeof FAQ;
  q: string;
  open: Record<string, boolean>;
  setOpen: (o: Record<string, boolean>) => void;
  clear: () => void;
}) {
  return (
    <section className="px-page bg-brand-butter-50 py-[clamp(52px,8vw,88px)]">
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5">
      <div className="scroll-x-hidden -mx-1 flex gap-2 px-1">
        {CATS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === cat}
            onClick={() => setCat(c)}
            className={`min-h-11 shrink-0 rounded-full border-[1.5px] px-[18px] text-[15px] font-bold whitespace-nowrap ${
              c === cat ? "border-brand-wine bg-brand-wine text-brand-butter" : "border-brand-espresso/30 text-brand-espresso"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <span className="text-sm text-brand-muted">{list.length} pertanyaan</span>
      <div className="flex flex-col border-t-[1.5px] border-brand-espresso/15">
        {list.map((d) => {
          const isOpen = Boolean(open[d.q]) || (Boolean(q) && list.length <= 3);
          return (
            <div key={d.q} className="border-b-[1.5px] border-brand-espresso/15">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen({ ...open, [d.q]: !isOpen })}
                className="flex min-h-[72px] w-full items-center gap-4 py-3.5 text-left"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xs font-bold tracking-[.14em] text-brand-pistachio-deep uppercase">{d.c}</span>
                  <span className="font-display text-[clamp(18px,2.2vw,21px)] leading-[1.35] font-bold">{d.q}</span>
                </span>
                <span className={`flex size-10 flex-none items-center justify-center rounded-full ${isOpen ? "bg-brand-wine text-brand-butter" : "bg-brand-butter text-brand-wine"}`}>
                  <Icon name={isOpen ? "remove" : "add"} size={22} />
                </span>
              </button>
              {isOpen && <p className="pr-14 pb-[22px] text-[17px] leading-[1.65] text-pretty text-brand-muted">{d.a}</p>}
            </div>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Icon name="help" size={40} className="text-brand-pistachio" />
          <span className="font-script text-2xl text-brand-wine">belum ada jawabannya</span>
          <button type="button" onClick={clear} className="inline-flex min-h-[52px] items-center rounded-full border-[1.5px] border-brand-espresso px-7 font-bold">
            Hapus pencarian
          </button>
        </div>
      )}
    </div>
    </section>
  );
}
