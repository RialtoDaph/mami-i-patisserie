"use client";

import { useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/preorderActions";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/preorder";
import { ErrorBox } from "@/components/ui";
import { Icon } from "@/components/brand";

/** The big "Tandai: {next}" button (prototype). */
export function NextStatusButton({ orderId, next }: { orderId: string; next: OrderStatus }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await setOrderStatus(orderId, next);
            if (res.error) setError(res.error);
          })
        }
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-md bg-brand-wine text-base font-bold text-brand-butter hover:brightness-[.93] disabled:opacity-60"
      >
        <Icon name="arrow_forward" size={22} />
        {pending ? "Menyimpan…" : `Tandai: ${STATUS_LABEL[next]}`}
      </button>
      <ErrorBox message={error} />
    </div>
  );
}

/** Any status (owner/admin) and cancel, folded away under the main button. */
export function OrderStatusControls({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = (s: OrderStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    start(async () => {
      const res = await setOrderStatus(orderId, s);
      if (res.error) setError(res.error);
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold text-brand-pistachio-deep">Ubah status ke</span>
        <select value={status} disabled={pending} onChange={(e) => set(e.target.value as OrderStatus)} className="input">
          {ORDER_STATUSES.filter((s) => s !== "batal").map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          {status === "batal" && <option value="batal">Batal</option>}
        </select>
      </label>
      {status !== "batal" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("batal", "Batalkan order ini? Kuota produknya akan dilepas.")}
          className="min-h-12 rounded-md border-[1.5px] border-brand-wine text-[15px] font-bold text-brand-wine disabled:opacity-60"
        >
          Batalkan order
        </button>
      )}
      <ErrorBox message={error} />
    </div>
  );
}
