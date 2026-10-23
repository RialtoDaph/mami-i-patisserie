"use client";

import { useState } from "react";
import { Chip } from "@/components/brand";
import { useScrolled } from "../useScrolled";

export interface MenuSection {
  id: string;
  label: string;
  count: number;
  node: React.ReactNode;
}

/** Sticky category chips (below the fixed bar once it shows) + the filtered sections. */
export function MenuFilter({ sections }: { sections: MenuSection[] }) {
  const [cat, setCat] = useState("semua");
  const scrolled = useScrolled(140);
  const total = sections.reduce((s, x) => s + x.count, 0);
  const tabs = [{ id: "semua", label: "Semua", count: total }, ...sections];
  return (
    <>
      <div
        className="px-page sticky z-40 flex flex-wrap gap-2.5 border-b-[1.5px] border-brand-espresso/12 bg-brand-butter-50 py-3.5 transition-[top] duration-300"
        style={{ top: scrolled ? 64 : 0 }}
      >
        {tabs.map((t) => (
          <Chip
            key={t.id}
            active={cat === t.id}
            count={t.count}
            onClick={() => {
              setCat(t.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={cat === t.id ? "" : "bg-brand-butter-50"}
          >
            {t.label}
          </Chip>
        ))}
      </div>
      {sections.map((s) => (cat === "semua" || cat === s.id ? <div key={s.id}>{s.node}</div> : null))}
    </>
  );
}
