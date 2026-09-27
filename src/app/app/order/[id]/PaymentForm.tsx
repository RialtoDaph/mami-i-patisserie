"use client";

import { useRef, useState, useTransition } from "react";
import { addPayment } from "@/lib/preorderActions";
import { uploadPhoto } from "@/lib/upload";
import { formatNumber, formatRupiah, parseNumberInput } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/preorder";
import { ErrorBox } from "@/components/ui";

const METHODS: PaymentMethod[] = ["transfer", "qris", "tunai"];

/** Record a payment (DP or settlement) with an optional proof photo. */
export function PaymentForm({ orderId, suggestions }: { orderId: string; suggestions: { label: string; amount: number }[] }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(suggestions[0] ? formatNumber(suggestions[0].amount) : "");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full">+ Catat pembayaran</button>;
  }

  const submit = () => {
    const n = parseNumberInput(amount);
    if (!n || n <= 0) return setError("Isi jumlah yang dibayar.");
    setError(null);
    start(async () => {
      try {
        const proofPath = file ? await uploadPhoto("payment-proofs", orderId, file) : null;
        const res = await addPayment({ orderId, amount: n, method, proofPath, note });
        if (res.error) return setError(res.error);
        setOpen(false);
        setFile(null);
        setNote("");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="card flex flex-col gap-3 border-cocoa/30">
      <h3 className="font-bold text-cocoa">Catat pembayaran</h3>
      <label>
        <span className="field-label">Jumlah (Rp)</span>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="input" />
      </label>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s.label} type="button" onClick={() => setAmount(formatNumber(s.amount))} className="chip-off">
              {s.label} {formatRupiah(s.amount)}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button key={m} type="button" onClick={() => setMethod(m)} className={method === m ? "chip-on" : "chip-off"}>{PAYMENT_METHOD_LABEL[m]}</button>
        ))}
      </div>
      <div>
        <span className="field-label">Bukti bayar (foto)</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary w-full">
          📷 {file ? `Ganti foto (${file.name.slice(0, 20)})` : "Pilih / foto bukti bayar"}
        </button>
      </div>
      <label>
        <span className="field-label">Catatan (opsional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
      </label>
      <ErrorBox message={error} />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
        <button type="button" disabled={pending} onClick={submit} className="btn-primary">{pending ? "Menyimpan…" : "Simpan"}</button>
      </div>
    </div>
  );
}
