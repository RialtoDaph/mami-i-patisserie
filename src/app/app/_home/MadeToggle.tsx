"use client";

import { useOptimistic, useTransition } from "react";
import { setProductionMark } from "@/lib/kitchenActions";
import { Icon } from "@/components/brand";

/** "Selesai dibuat" tick for one product on one day (pastry chef's Beranda). */
export function MadeToggle({ date, productId, done }: { date: string; productId: string; done: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const res = await setProductionMark(date, productId, !optimistic);
          if (res.error) alert(res.error);
        })
      }
      className={`flex min-h-12 flex-none items-center gap-2 rounded-md border-[1.5px] px-3.5 text-sm font-bold ${
        optimistic ? "border-brand-olive bg-brand-olive text-brand-butter" : "border-brand-espresso/40 bg-white"
      }`}
    >
      <Icon name={optimistic ? "check_circle" : "radio_button_unchecked"} size={20} />
      {optimistic ? "Selesai" : "Selesai dibuat"}
    </button>
  );
}
