"use client";

import { useActionState } from "react";
import { saveApprovalRules, type SavedResult } from "@/lib/planActions";
import type { ApprovalRules } from "@/lib/plans";
import { Panel } from "@/components/app/ui";
import { AppField, FormMessage, NumberInput } from "@/components/app/form";

export function RulesForm({ rules, backupName }: { rules: ApprovalRules; backupName: string | null }) {
  const [state, action, pending] = useActionState<SavedResult, FormData>(saveApprovalRules, {});
  return (
    <Panel className="max-w-[700px] p-[18px]">
      <form action={action} className="flex flex-col gap-3">
        <div className="grid gap-3 nav:grid-cols-3">
          <AppField label="Belanja / reparasi di atas (Rp)">
            <NumberInput name="alat" defaultValue={rules.alatLimit} required />
          </AppField>
          <AppField label="Campaign berbayar di atas (Rp)">
            <NumberInput name="campaign" defaultValue={rules.campaignLimit} required />
          </AppField>
          <AppField label={`${backupName ?? "Cadangan"} boleh putuskan setelah (jam)`}>
            <NumberInput name="hours" defaultValue={rules.fallbackHours} max={720} required />
          </AppField>
        </div>
        <p className="text-[13px] text-brand-muted">
          Perubahan harga jual dan rekrut/berhentikan karyawan selalu perlu persetujuan.{" "}
          {backupName ? `Pemutus cadangan: ${backupName}.` : "Pemutus cadangan belum dipilih: atur di Lainnya › Akun tim."}
        </p>
        <FormMessage error={state.error} ok={state.savedAt ? state.message : null} />
        <button type="submit" disabled={pending} className="btn-secondary self-start">
          {pending ? "Menyimpan…" : "Simpan aturan"}
        </button>
      </form>
    </Panel>
  );
}
