"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { submitApproval, type SavedResult } from "@/lib/planActions";
import { APPROVAL_KIND_LABEL, needsApproval, type ApprovalKind, type ApprovalRules } from "@/lib/plans";
import { formatRupiah } from "@/lib/format";
import { Icon } from "@/components/brand";
import { Panel, PanelTitle } from "@/components/app/ui";
import { AppField, FormMessage, NumberInput, inputClass } from "@/components/app/form";

interface Prefill {
  kind?: ApprovalKind;
  title?: string;
  amount?: number | null;
  note?: string;
  milestoneId?: string;
}

/** "+ Ajukan" → form. Shows live whether the request needs Alto or is recorded right away. */
export function ApprovalForm({ rules, initialOpen, prefill }: { rules: ApprovalRules; initialOpen: boolean; prefill: Prefill }) {
  const [open, setOpen] = useState(initialOpen);
  const [kind, setKind] = useState<ApprovalKind>(prefill.kind ?? "alat");
  const [amount, setAmount] = useState<number | null>(prefill.amount ?? null);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();
  const [state, action, pending] = useActionState<SavedResult, FormData>(async (prev, fd) => {
    const res = await submitApproval(prev, fd);
    if (!res.error) {
      setOpen(false);
      setFormKey((k) => k + 1);
      setAmount(null);
      // Drop the milestone prefill from the URL so the next request starts empty.
      if (prefill.milestoneId || prefill.title) router.replace("/app/setuju");
    }
    return res;
  }, {});
  const needs = needsApproval(kind, amount ?? 0, rules);

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-brand-wine px-4 text-[15px] font-bold text-brand-butter"
        >
          <Icon name="add" size={20} />
          Ajukan
        </button>
        {state.message && !state.error && <FormMessage ok={state.message} />}
      </div>
    );
  }

  return (
    <Panel className="w-full p-[18px]">
      <form key={formKey} action={action} className="flex flex-col gap-3">
        <PanelTitle aside={<button type="button" onClick={() => setOpen(false)} className="min-h-10 px-2 text-brand-muted">Batal</button>}>
          Ajukan ke Alto
        </PanelTitle>
        {prefill.milestoneId && <input type="hidden" name="milestone_id" value={prefill.milestoneId} />}
        <div className="grid gap-3 nav:grid-cols-2">
          <AppField label="Jenis">
            <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as ApprovalKind)} className={`${inputClass} appearance-auto`}>
              {(Object.keys(APPROVAL_KIND_LABEL) as ApprovalKind[]).map((k) => (
                <option key={k} value={k}>{APPROVAL_KIND_LABEL[k]}</option>
              ))}
            </select>
          </AppField>
          <AppField label="Nominal (Rp)" hint={amount ? formatRupiah(amount) : kind === "harga" || kind === "karyawan" ? "Boleh kosong" : undefined}>
            <NumberInput name="amount" defaultValue={prefill.amount} placeholder="mis. 2.500.000" onValue={setAmount} />
          </AppField>
        </div>
        <AppField label="Judul">
          <input name="title" required maxLength={200} defaultValue={prefill.title} placeholder="mis. Chiller display 2 pintu" className={inputClass} />
        </AppField>
        <AppField label="Alasan">
          <textarea name="note" maxLength={1000} defaultValue={prefill.note} rows={3} placeholder="Kenapa perlu, sudah bandingkan harga?" className={`${inputClass} py-2.5 leading-normal`} />
        </AppField>
        <p className={`flex items-center gap-1.5 text-sm font-bold ${needs ? "text-brand-wine" : "text-brand-olive"}`}>
          <Icon name={needs ? "approval" : "task_alt"} size={20} />
          {needs ? "Perlu persetujuan Alto" : "Di bawah batas: langsung tercatat, tanpa menunggu Alto"}
        </p>
        <FormMessage error={state.error} />
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-md bg-brand-wine px-5 text-[15px] font-bold text-brand-butter disabled:opacity-60">
          <Icon name="send" size={20} />
          {pending ? "Mengirim…" : needs ? "Kirim ke Alto" : "Catat"}
        </button>
      </form>
    </Panel>
  );
}
