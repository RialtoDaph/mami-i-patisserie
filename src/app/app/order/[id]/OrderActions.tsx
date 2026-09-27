"use client";

import { useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/preorderActions";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/preorder";
import { ErrorBox } from "@/components/ui";

/** Big "next status" button plus a picker for any status and a cancel button. */
export function OrderStatusControls({ orderId, status, next }: { orderId: string; status: OrderStatus; next: OrderStatus | null }) {
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
    <div className="flex flex-col gap-2">
      {next && (
        <button type="button" disabled={pending} onClick={() => set(next)} className="btn-primary w-full">
          {pending ? "Menyimpan…" : `Tandai: ${STATUS_LABEL[next]} →`}
        </button>
      )}
      <label className="flex items-center gap-2">
        <span className="text-sm text-muted">Ubah status:</span>
        <select value={status} disabled={pending} onChange={(e) => set(e.target.value as OrderStatus)} className="input flex-1">
          {ORDER_STATUSES.filter((s) => s !== "batal").map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          {status === "batal" && <option value="batal">Batal</option>}
        </select>
      </label>
      {status !== "batal" ? (
        <button type="button" disabled={pending} onClick={() => set("batal", "Batalkan order ini? Kuota produknya akan dilepas.")} className="btn-danger w-full">
          Batalkan order
        </button>
      ) : null}
      <ErrorBox message={error} />
    </div>
  );
}
