"use client";

import { useState, useTransition } from "react";
import { decideApproval } from "@/lib/planActions";
import { Icon } from "@/components/brand";
import { inputClass } from "@/components/app/form";

/** Decision note + Setujui (olive) / Tolak (wine outline). */
export function DecideBox({ id, backup }: { id: string; backup: boolean }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const decide = (approve: boolean) =>
    start(async () => {
      const res = await decideApproval(id, approve, note);
      setError(res.error ?? "");
    });
  return (
    <div className="mt-1 flex flex-col gap-2 border-t border-dashed border-brand-espresso/25 pt-2.5">
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Catatan keputusan (opsional)" aria-label="Catatan keputusan" className={inputClass} />
      {error && <p role="alert" className="text-sm font-semibold text-brand-wine">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-brand-olive px-4 text-[15px] font-bold text-brand-butter disabled:opacity-60"
        >
          <Icon name="check" size={20} />
          {backup ? "Setujui (cadangan)" : "Setujui"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(false)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border-[1.5px] border-brand-wine/60 bg-white px-4 text-[15px] font-bold text-brand-wine disabled:opacity-60"
        >
          <Icon name="close" size={20} />
          Tolak
        </button>
      </div>
    </div>
  );
}
