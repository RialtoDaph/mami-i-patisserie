// Persetujuan rules (stage 5c). Mirrors approval_needed() and decide_approval() in SQL.
import type { AppRole } from "../permissions";

export type ApprovalKind = "alat" | "harga" | "karyawan" | "campaign" | "lain";
export type ApprovalStatus = "menunggu" | "disetujui" | "ditolak" | "dicatat";

export const APPROVAL_KIND_LABEL: Record<ApprovalKind, string> = {
  alat: "Belanja / reparasi alat",
  harga: "Perubahan harga jual",
  karyawan: "Rekrut / berhentikan karyawan",
  campaign: "Campaign berbayar",
  lain: "Lainnya",
};

export const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  menunggu: "Menunggu Alto",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dicatat: "Dicatat",
};

export interface ApprovalRules {
  alatLimit: number;
  campaignLimit: number;
  fallbackHours: number;
}

export interface Approval {
  id: string;
  kind: ApprovalKind;
  title: string;
  amount: number;
  note: string | null;
  milestoneId: string | null;
  requestedBy: string | null;
  createdAt: string;
  status: ApprovalStatus;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

/** Price changes and hiring always need Alto; campaigns above the campaign limit; anything else above the alat limit. */
export function needsApproval(kind: ApprovalKind, amount: number, rules: ApprovalRules): boolean {
  if (kind === "harga" || kind === "karyawan") return true;
  return amount > (kind === "campaign" ? rules.campaignLimit : rules.alatLimit);
}

const HOUR = 3_600_000;

/** When the backup decider may step in. */
export function deadline(a: Pick<Approval, "createdAt">, rules: ApprovalRules): number {
  return Date.parse(a.createdAt) + rules.fallbackHours * HOUR;
}

export function isOverdue(a: Pick<Approval, "createdAt" | "status">, rules: ApprovalRules, now: number): boolean {
  return a.status === "menunggu" && now >= deadline(a, rules);
}

export interface Decider {
  role: AppRole | null;
  approvalBackup: boolean;
}

/** Alto decides any pending request; the backup decider (an admin, Mami) only after the fallback hours. */
export function canDecide(a: Pick<Approval, "createdAt" | "status">, who: Decider, rules: ApprovalRules, now: number): boolean {
  if (a.status !== "menunggu") return false;
  if (who.role === "owner") return true;
  return who.role === "admin" && who.approvalBackup && isOverdue(a, rules, now);
}
