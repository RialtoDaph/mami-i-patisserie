// Goals & milestones (stage 5c). "Telat" is computed: an open milestone past its date.

export const GOAL_AREAS = ["Keuangan", "Produksi", "Marketing", "Interior", "Konsep", "Operasional"] as const;
export type GoalArea = (typeof GOAL_AREAS)[number];

export type MilestoneStatus = "belum" | "jalan" | "selesai";
export type MilestoneState = MilestoneStatus | "telat";

export const MILESTONE_LABEL: Record<MilestoneState, string> = {
  belum: "Belum mulai",
  jalan: "Sedang jalan",
  selesai: "Selesai",
  telat: "Telat",
};

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  dueDate: string;
  pic: string | null;
  cost: number;
  status: MilestoneStatus;
  statusBy: string | null;
  statusAt: string | null;
}

export interface Goal {
  id: string;
  title: string;
  area: GoalArea;
  pic: string | null;
  dueDate: string;
  milestones: Milestone[];
}

export function milestoneState(m: Pick<Milestone, "status" | "dueDate">, today: string): MilestoneState {
  return m.status !== "selesai" && m.dueDate < today ? "telat" : m.status;
}

/** Tap cycle: belum → jalan → selesai → belum. */
export function nextMilestoneStatus(s: MilestoneStatus): MilestoneStatus {
  return s === "belum" ? "jalan" : s === "jalan" ? "selesai" : "belum";
}

export function goalProgress(g: Pick<Goal, "milestones">, today: string): { done: number; total: number; late: number } {
  return {
    done: g.milestones.filter((m) => m.status === "selesai").length,
    total: g.milestones.length,
    late: g.milestones.filter((m) => milestoneState(m, today) === "telat").length,
  };
}

/** Owners update any milestone; the manager only milestones they are PIC of. Mirrors set_milestone_status(). */
export function canUpdateMilestone(role: string | null, userId: string, m: Pick<Milestone, "pic">): boolean {
  if (role === "owner" || role === "admin") return true;
  return role === "manager" && m.pic === userId;
}

/** Open milestones soonest first, optionally limited to some areas (Beranda focus per person). */
export function openMilestones(goals: Goal[], areas?: readonly string[]): { goal: Goal; milestone: Milestone }[] {
  return goals
    .filter((g) => !areas || areas.includes(g.area))
    .flatMap((goal) => goal.milestones.filter((m) => m.status !== "selesai").map((milestone) => ({ goal, milestone })))
    .sort((a, b) => a.milestone.dueDate.localeCompare(b.milestone.dueDate));
}
