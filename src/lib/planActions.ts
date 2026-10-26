"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { getCurrentUser } from "./data";
import { can } from "./permissions";
import { friendlyError } from "./errors";
import { isIsoDate } from "./preorder";
import { APPROVAL_KIND_LABEL, GOAL_AREAS, type ApprovalKind, type MilestoneStatus } from "./plans";
import type { ActionResult } from "./actions";

// Stage 5c actions: Persetujuan and Target & Rencana. RLS + RPCs enforce who may do what; the checks here only
// give a clear message first.

export type SavedResult = ActionResult & { savedAt?: number; message?: string };

function refresh() {
  revalidatePath("/app", "layout");
}

/** Digits only: "Rp 2.000.000" → 2000000; empty → null. */
function rupiah(v: FormDataEntryValue | null): number | null {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

async function requireAlto() {
  const user = await getCurrentUser();
  if (!can(user.role, "plans.manage")) throw new Error("Hanya Alto yang bisa mengatur ini.");
  return user;
}

// ---- Persetujuan ---------------------------------------------------------------

export async function submitApproval(_prev: SavedResult, formData: FormData): Promise<SavedResult> {
  const kind = String(formData.get("kind") ?? "") as ApprovalKind;
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const amount = rupiah(formData.get("amount")) ?? 0;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);
  const milestone = String(formData.get("milestone_id") ?? "") || null;
  if (!(kind in APPROVAL_KIND_LABEL)) return { error: "Pilih jenis pengajuan." };
  if (!title) return { error: "Isi judulnya dulu." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_approval", { p_kind: kind, p_title: title, p_amount: amount, p_note: note, p_milestone: milestone });
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now(), message: data === "menunggu" ? "Terkirim ke Alto" : "Tercatat" };
}

export async function decideApproval(id: string, approve: boolean, note: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_approval", { p_id: id, p_approve: approve, p_note: note.trim().slice(0, 300) });
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}

export async function saveApprovalRules(_prev: SavedResult, formData: FormData): Promise<SavedResult> {
  await requireAlto();
  const alat = rupiah(formData.get("alat"));
  const campaign = rupiah(formData.get("campaign"));
  const hours = rupiah(formData.get("hours"));
  if (alat == null || campaign == null) return { error: "Isi kedua batas nominal." };
  if (!hours || hours > 720) return { error: "Jam cadangan harus 1–720." };
  const supabase = await createClient();
  const { error } = await supabase.from("approval_rules").update({ alat_limit: alat, campaign_limit: campaign, fallback_hours: hours }).eq("id", true);
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now(), message: "Aturan disimpan" };
}

// ---- Targets ---------------------------------------------------------------------

const MONTH_FIELDS = {
  cafe: "cafe_revenue", preorder: "preorder_revenue", hampers: "hampers_revenue", web: "web_revenue",
  orders: "orders", avgOrder: "avg_order", foodCost: "food_cost_pct",
} as const;

export async function saveMonthTargets(_prev: SavedResult, formData: FormData): Promise<SavedResult> {
  await requireAlto();
  const month = String(formData.get("month") ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Bulan tidak valid." };
  const row: Record<string, unknown> = { month: `${month}-01` };
  for (const [field, column] of Object.entries(MONTH_FIELDS)) row[column] = rupiah(formData.get(field));
  if (row.food_cost_pct != null && (row.food_cost_pct as number) > 100) return { error: "Food cost maks 100%." };
  const supabase = await createClient();
  const { error } = await supabase.from("monthly_targets").upsert(row, { onConflict: "month" });
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now(), message: "Target disimpan" };
}

export async function saveYearTargets(_prev: SavedResult, formData: FormData): Promise<SavedResult> {
  await requireAlto();
  const year = Number(formData.get("year"));
  if (!Number.isInteger(year)) return { error: "Tahun tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("year_targets")
    .upsert({ year, revenue: rupiah(formData.get("revenue")), orders: rupiah(formData.get("orders")) }, { onConflict: "year" });
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now(), message: `Target ${year} disimpan` };
}

/** Back to "sum of the 12 monthly targets". */
export async function resetYearTargets(year: number): Promise<ActionResult> {
  await requireAlto();
  const supabase = await createClient();
  const { error } = await supabase.from("year_targets").delete().eq("year", year);
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}

// ---- Goals & milestones ----------------------------------------------------------

export async function saveGoal(_prev: SavedResult, formData: FormData): Promise<SavedResult> {
  await requireAlto();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const area = String(formData.get("area") ?? "");
  const pic = String(formData.get("pic") ?? "") || null;
  const due = String(formData.get("due_date") ?? "");
  if (!title) return { error: "Isi nama goal dulu." };
  if (!(GOAL_AREAS as readonly string[]).includes(area)) return { error: "Pilih area." };
  if (!isIsoDate(due)) return { error: "Isi tanggal target." };
  const supabase = await createClient();
  const row = { title, area, pic, due_date: due };
  const { error } = id ? await supabase.from("goals").update(row).eq("id", id) : await supabase.from("goals").insert(row);
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now(), message: "Goal disimpan" };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  await requireAlto();
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}

export async function saveMilestone(_prev: SavedResult, formData: FormData): Promise<SavedResult> {
  await requireAlto();
  const id = String(formData.get("id") ?? "");
  const goalId = String(formData.get("goal_id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const due = String(formData.get("due_date") ?? "");
  const pic = String(formData.get("pic") ?? "") || null;
  const cost = rupiah(formData.get("cost")) ?? 0;
  if (!goalId) return { error: "Goal tidak ditemukan." };
  if (!title) return { error: "Isi nama milestone dulu." };
  if (!isIsoDate(due)) return { error: "Isi tanggalnya." };
  const supabase = await createClient();
  const row = { goal_id: goalId, title, due_date: due, pic, cost };
  const { error } = id ? await supabase.from("milestones").update(row).eq("id", id) : await supabase.from("milestones").insert(row);
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now(), message: "Milestone disimpan" };
}

export async function deleteMilestone(id: string): Promise<ActionResult> {
  await requireAlto();
  const supabase = await createClient();
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}

export async function setMilestoneStatus(id: string, status: MilestoneStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_milestone_status", { p_id: id, p_status: status });
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}
