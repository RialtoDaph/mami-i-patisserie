"use client";

import { useState, useTransition } from "react";
import { saveSettings } from "@/lib/preorderActions";
import { formatNumber, parseNumberInput } from "@/lib/format";
import { formatWhatsapp, type Settings } from "@/lib/preorder";
import { ErrorBox } from "@/components/ui";

export function SettingsForm({ settings, canEdit }: { settings: Settings; canEdit: boolean }) {
  const [v, setV] = useState({
    businessName: settings.businessName,
    businessWhatsapp: settings.businessWhatsapp ? formatWhatsapp(settings.businessWhatsapp) : "",
    bankName: settings.bankName ?? "",
    bankAccountNo: settings.bankAccountNo ?? "",
    bankAccountName: settings.bankAccountName ?? "",
    qrisNote: settings.qrisNote ?? "",
    pickupAddress: settings.pickupAddress ?? "",
    defaultDpPercent: formatNumber(settings.defaultDpPercent, 2),
  });
  const [msg, setMsg] = useState<{ error?: string; ok?: boolean }>({});
  const [pending, start] = useTransition();
  const field = (key: keyof typeof v, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label>
      <span className="field-label">{label}</span>
      <input value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} className="input" {...props} />
    </label>
  );
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSettings({ ...v, defaultDpPercent: parseNumberInput(v.defaultDpPercent) ?? 50 });
          setMsg(res.error ? { error: res.error } : { ok: true });
        });
      }}
    >
      <fieldset disabled={!canEdit} className="card flex flex-col gap-3">
        <h2 className="font-bold text-cocoa">Usaha</h2>
        {field("businessName", "Nama usaha")}
        {field("businessWhatsapp", "WhatsApp usaha", { inputMode: "tel" })}
        <label>
          <span className="field-label">Alamat ambil sendiri</span>
          <textarea value={v.pickupAddress} onChange={(e) => setV({ ...v, pickupAddress: e.target.value })} rows={2} className="input py-2" />
        </label>
      </fieldset>
      <fieldset disabled={!canEdit} className="card flex flex-col gap-3">
        <h2 className="font-bold text-cocoa">Pembayaran (muncul di pesan WhatsApp)</h2>
        {field("bankName", "Nama bank")}
        {field("bankAccountNo", "Nomor rekening", { inputMode: "numeric" })}
        {field("bankAccountName", "Atas nama")}
        {field("qrisNote", "Keterangan QRIS")}
        {field("defaultDpPercent", "DP default (%)", { inputMode: "decimal" })}
      </fieldset>
      <ErrorBox message={msg.error} />
      {msg.ok && <p className="font-semibold text-ok">✓ Tersimpan</p>}
      {canEdit && <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? "Menyimpan…" : "Simpan pengaturan"}</button>}
    </form>
  );
}
