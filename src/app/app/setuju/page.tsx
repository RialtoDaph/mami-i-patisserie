import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPlans } from "@/lib/plansData";
import {
  ago, APPROVAL_KIND_LABEL, requestTime, APPROVAL_STATUS_LABEL, canDecide, deadline, dualTime, isOverdue, type Approval, type ApprovalKind,
} from "@/lib/plans";
import { formatRupiah } from "@/lib/format";
import { ChipLink, Clocks, EmptyNote, Panel, SectionLabel, StatusPill } from "@/components/app/ui";
import { ApprovalForm } from "./ApprovalForm";
import { DecideBox } from "./DecideBox";
import { RulesForm } from "./RulesForm";

export const metadata: Metadata = { title: "Persetujuan" };

const FILTERS = [
  ["menunggu", "Menunggu"],
  ["selesai", "Sudah diputuskan"],
  ["semua", "Semua"],
] as const;
type Filter = (typeof FILTERS)[number][0];

const TONE = { menunggu: "butter", disetujui: "olive", ditolak: "wine", dicatat: "white" } as const;

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; ajukan?: string; judul?: string; nominal?: string; jenis?: string; milestone?: string; catatan?: string }>;
}) {
  const sp = await searchParams;
  const [user, plans] = await Promise.all([getCurrentUser(), loadPlans()]);
  const now = requestTime();
  const { rules, approvals } = plans;
  const names = new Map(plans.team.map((t) => [t.id, t.name]));
  const backup = plans.team.find((t) => t.approvalBackup)?.name ?? "Mami";
  const filter: Filter = FILTERS.some(([k]) => k === sp.f) ? (sp.f as Filter) : "menunggu";
  const pending = approvals.filter((a) => a.status === "menunggu");
  const visible = approvals.filter((a) => filter === "semua" || (filter === "menunggu" ? a.status === "menunggu" : a.status !== "menunggu"));
  const decider = { role: user.role, approvalBackup: user.approvalBackup };
  const isAlto = can(user.role, "plans.manage");

  const line = (a: Approval) => {
    if (a.status === "menunggu") {
      return isOverdue(a, rules, now)
        ? `Lewat ${rules.fallbackHours} jam (${dualTime(deadline(a, rules))}). ${backup} boleh memutuskan.`
        : `Batas jawab Alto: ${dualTime(deadline(a, rules))}`;
    }
    if (a.status === "dicatat") return "Di bawah batas, tidak perlu persetujuan.";
    const who = (a.decidedBy && names.get(a.decidedBy)) || "?";
    return `${APPROVAL_STATUS_LABEL[a.status]} ${who}, ${a.decidedAt ? dualTime(Date.parse(a.decidedAt)) : ""}${a.decisionNote ? ` · “${a.decisionNote}”` : ""}`;
  };

  const prefillKind = sp.jenis && sp.jenis in APPROVAL_KIND_LABEL ? (sp.jenis as ApprovalKind) : undefined;

  return (
    <div className="mx-auto flex max-w-[1090px] flex-col gap-3.5">
      <Clocks now={now} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="no-scrollbar -mx-3.5 flex gap-2 overflow-x-auto px-3.5 nav:mx-0 nav:px-0">
          {FILTERS.map(([k, label]) => (
            <ChipLink key={k} href={`/app/setuju${k === "menunggu" ? "" : `?f=${k}`}`} active={filter === k}>
              {k === "menunggu" ? `${label} · ${pending.length}` : label}
            </ChipLink>
          ))}
        </div>
        {can(user.role, "approval.submit") && (
          <ApprovalForm
            rules={rules}
            initialOpen={sp.ajukan === "1"}
            prefill={{
              kind: prefillKind, title: sp.judul?.slice(0, 200), amount: sp.nominal ? Number(sp.nominal.replace(/\D/g, "")) || null : null,
              note: sp.catatan?.slice(0, 1000), milestoneId: sp.milestone,
            }}
          />
        )}
      </div>

      <p className="text-sm leading-relaxed text-brand-muted">
        Perlu persetujuan Alto: belanja/reparasi di atas {formatRupiah(rules.alatLimit)}, campaign di atas {formatRupiah(rules.campaignLimit)},
        perubahan harga jual, rekrut/berhentikan karyawan. Kalau Alto belum jawab {rules.fallbackHours} jam, {backup} boleh memutuskan.
      </p>

      {visible.length === 0 ? (
        <EmptyNote>{filter === "menunggu" ? "Tidak ada yang menunggu persetujuan." : "Belum ada pengajuan."}</EmptyNote>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] items-start gap-3">
          {visible.map((a) => {
            const late = isOverdue(a, rules, now);
            return (
              <Panel key={a.id} className="flex flex-col gap-2 px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] leading-snug font-bold">{a.title}</h3>
                  <StatusPill tone={TONE[a.status]}>{APPROVAL_STATUS_LABEL[a.status]}</StatusPill>
                </div>
                <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                  <b>{APPROVAL_KIND_LABEL[a.kind]}</b>
                  {a.amount > 0 && <span className="tabular-nums">{formatRupiah(a.amount)}</span>}
                  <span className="text-brand-muted">· {(a.requestedBy && names.get(a.requestedBy)) || "?"}, {ago(Date.parse(a.createdAt), now)}</span>
                </p>
                {a.note && <p className="text-sm leading-relaxed whitespace-pre-line">{a.note}</p>}
                <p className={`text-[13px] font-bold ${a.status === "menunggu" && late ? "text-brand-wine" : "text-brand-muted"}`}>{line(a)}</p>
                {canDecide(a, decider, rules, now) && <DecideBox id={a.id} backup={user.role !== "owner"} />}
              </Panel>
            );
          })}
        </div>
      )}

      {isAlto && (
        <>
          <SectionLabel className="mt-2">Aturan persetujuan · hanya Alto</SectionLabel>
          <RulesForm rules={rules} backupName={plans.team.find((t) => t.approvalBackup)?.name ?? null} />
        </>
      )}
    </div>
  );
}
