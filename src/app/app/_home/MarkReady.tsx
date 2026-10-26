"use client";

import { useTransition } from "react";
import { setOrderStatus } from "@/lib/preorderActions";

/** "Tandai Siap" on the pastry chef's Beranda. */
export function MarkReady({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setOrderStatus(orderId, "siap");
          if (res.error) alert(res.error);
        })
      }
      className="min-h-11 flex-none rounded-md bg-brand-wine px-4 text-sm font-bold text-brand-butter disabled:opacity-60"
    >
      {pending ? "…" : "Tandai Siap"}
    </button>
  );
}
