"use client";

import { useState } from "react";

/** Handwritten card under the Blessings Box: tilted, straightens and lifts on hover or tap. */
export function GreetingCardTeaser({ text }: { text: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className={`flex flex-col gap-2 border border-brand-espresso/15 bg-white px-6 py-[22px] text-left transition-[transform,box-shadow] duration-350 ease-(--ease-pop) hover:scale-[1.04] hover:rotate-0 hover:shadow-[0_24px_44px_rgb(62_39_35/.22)] ${
        on ? "scale-[1.04] rotate-0 shadow-[0_24px_44px_rgb(62_39_35/.22)]" : "-rotate-[1.5deg] shadow-[0_10px_24px_rgb(62_39_35/.12)]"
      }`}
    >
      <span className="text-[11px] font-bold tracking-[.2em] text-brand-pistachio-deep uppercase">+ kartu ucapan</span>
      <span className="font-script text-[22px] leading-[1.35]">{text}</span>
    </button>
  );
}
