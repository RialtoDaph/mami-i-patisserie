import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { AppRole } from "./permissions";
import type { Approval, ApprovalRules, Goal, MonthTargetRow, YearTargetRow } from "./plans";

// Stage 5c data: approvals, rules, goals with milestones, targets and the team names for PIC / "diajukan oleh".

type Num = number | string;
const numOrNull = (v: Num | null) => (v == null ? null : Number(v));

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  role: AppRole | null;
  approvalBackup: boolean;
}

export interface PlansData {
  rules: ApprovalRules;
  approvals: Approval[];
  goals: Goal[];
  monthTargets: MonthTargetRow[];
  yearTargets: YearTargetRow[];
  team: TeamMember[];
}

interface ApprovalRow {
  id: string; kind: Approval["kind"]; title: string; amount: Num; note: string | null; milestone_id: string | null;
  requested_by: string | null; created_at: string; status: Approval["status"]; decided_by: string | null;
  decided_at: string | null; decision_note: string | null;
}
interface MilestoneRow {
  id: string; goal_id: string; title: string; due_date: string; pic: string | null; cost: Num;
  status: Goal["milestones"][number]["status"]; status_by: string | null; status_at: string | null;
}
interface GoalRow { id: string; title: string; area: Goal["area"]; pic: string | null; due_date: string; milestones: MilestoneRow[] }
interface MonthRow {
  month: string; cafe_revenue: Num | null; preorder_revenue: Num | null; hampers_revenue: Num | null; web_revenue: Num | null;
  orders: number | null; avg_order: Num | null; food_cost_pct: Num | null;
}

export const loadPlans = cache(async (): Promise<PlansData> => {
  const supabase = await createClient();
  const [r, a, g, m, y, t] = await Promise.all([
    supabase.from("approval_rules").select("*").maybeSingle(),
    supabase.from("approvals").select("*").order("created_at", { ascending: false }),
    supabase.from("goals").select("*, milestones(*)").order("due_date"),
    supabase.from("monthly_targets").select("*").order("month"),
    supabase.from("year_targets").select("*").order("year"),
    supabase.rpc("team_names"),
  ]);
  const error = r.error ?? a.error ?? g.error ?? m.error ?? y.error ?? t.error;
  if (error) throw new Error(`Gagal memuat data rencana: ${error.message}`);
  return {
    rules: r.data
      ? { alatLimit: Number(r.data.alat_limit), campaignLimit: Number(r.data.campaign_limit), fallbackHours: r.data.fallback_hours }
      : { alatLimit: 2_000_000, campaignLimit: 1_000_000, fallbackHours: 48 },
    approvals: (a.data as ApprovalRow[]).map((x) => ({
      id: x.id, kind: x.kind, title: x.title, amount: Number(x.amount), note: x.note, milestoneId: x.milestone_id,
      requestedBy: x.requested_by, createdAt: x.created_at, status: x.status, decidedBy: x.decided_by, decidedAt: x.decided_at,
      decisionNote: x.decision_note,
    })),
    goals: (g.data as GoalRow[]).map((x) => ({
      id: x.id, title: x.title, area: x.area, pic: x.pic, dueDate: x.due_date,
      milestones: x.milestones
        .map((ms) => ({
          id: ms.id, goalId: ms.goal_id, title: ms.title, dueDate: ms.due_date, pic: ms.pic, cost: Number(ms.cost),
          status: ms.status, statusBy: ms.status_by, statusAt: ms.status_at,
        }))
        .sort((p, q) => p.dueDate.localeCompare(q.dueDate) || p.title.localeCompare(q.title)),
    })),
    monthTargets: (m.data as MonthRow[]).map((x) => ({
      month: x.month, cafe: numOrNull(x.cafe_revenue), preorder: numOrNull(x.preorder_revenue), hampers: numOrNull(x.hampers_revenue),
      web: numOrNull(x.web_revenue), orders: x.orders, avgOrder: numOrNull(x.avg_order), foodCost: numOrNull(x.food_cost_pct),
    })),
    yearTargets: (y.data as { year: number; revenue: Num | null; orders: number | null }[]).map((x) => ({
      year: x.year, revenue: numOrNull(x.revenue), orders: x.orders,
    })),
    team: (t.data as { id: string; full_name: string; title: string; role: AppRole | null; approval_backup: boolean }[]).map((x) => ({
      id: x.id, name: x.full_name || "Tanpa nama", title: x.title, role: x.role, approvalBackup: x.approval_backup,
    })),
  };
});
