"use client";

import { useState, useTransition } from "react";
import { saveCustomer } from "@/lib/preorderActions";
import { formatWhatsapp, type Customer } from "@/lib/preorder";
import { ErrorBox } from "@/components/ui";

export function CustomerForm({ customer, canEdit }: { customer: Customer; canEdit: boolean }) {
  const [name, setName] = useState(customer.name);
  const [wa, setWa] = useState(formatWhatsapp(customer.whatsapp));
  const [address, setAddress] = useState(customer.address ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [msg, setMsg] = useState<{ error?: string; ok?: boolean }>({});
  const [pending, start] = useTransition();
  return (
    <form
      className="card flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveCustomer({ id: customer.id, name, whatsapp: wa, address, notes });
          setMsg(res.error ? { error: res.error } : { ok: true });
        });
      }}
    >
      <fieldset disabled={!canEdit} className="flex flex-col gap-3">
        <label><span className="field-label">Nama</span><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></label>
        <label><span className="field-label">WhatsApp</span><input value={wa} onChange={(e) => setWa(e.target.value)} inputMode="tel" className="input" /></label>
        <label><span className="field-label">Alamat</span><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input py-2" /></label>
        <label><span className="field-label">Catatan</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input py-2" /></label>
      </fieldset>
      <ErrorBox message={msg.error} />
      {msg.ok && <p className="text-sm font-semibold text-ok">✓ Tersimpan</p>}
      {canEdit && <button type="submit" disabled={pending} className="btn-secondary w-full">{pending ? "Menyimpan…" : "Simpan data pelanggan"}</button>}
    </form>
  );
}
