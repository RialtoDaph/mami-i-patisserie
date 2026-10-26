import { describe, expect, it } from "vitest";
import { order } from "../preorder/fixtures";
import {
  actuals, canDecide, canUpdateMilestone, elapsedDays, goalProgress, isOverdue, milestoneState, monthTarget, needsApproval,
  nextMilestoneStatus, openMilestones, progress, shiftMonth, yearTarget, type Goal, type MonthTargetRow,
} from ".";

const rules = { alatLimit: 2_000_000, campaignLimit: 1_000_000, fallbackHours: 48 };

describe("approvals", () => {
  it("follows the limits", () => {
    expect(needsApproval("alat", 2_000_000, rules)).toBe(false);
    expect(needsApproval("alat", 2_000_001, rules)).toBe(true);
    expect(needsApproval("lain", 2_500_000, rules)).toBe(true);
    expect(needsApproval("campaign", 1_500_000, rules)).toBe(true);
    expect(needsApproval("campaign", 900_000, rules)).toBe(false);
    expect(needsApproval("harga", 0, rules)).toBe(true);
    expect(needsApproval("karyawan", 0, rules)).toBe(true);
  });
  it("lets the backup decide only after the fallback hours", () => {
    const created = "2026-10-24T10:00:00Z";
    const a = { createdAt: created, status: "menunggu" as const };
    const before = Date.parse("2026-10-26T09:59:00Z");
    const after = Date.parse("2026-10-26T10:00:00Z");
    const mami = { role: "admin" as const, approvalBackup: true };
    expect(canDecide(a, { role: "owner", approvalBackup: false }, rules, before)).toBe(true);
    expect(canDecide(a, mami, rules, before)).toBe(false);
    expect(canDecide(a, mami, rules, after)).toBe(true);
    expect(isOverdue(a, rules, after)).toBe(true);
    expect(canDecide(a, { role: "admin", approvalBackup: false }, rules, after)).toBe(false);
    expect(canDecide(a, { role: "manager", approvalBackup: true }, rules, after)).toBe(false);
    expect(canDecide({ ...a, status: "disetujui" }, mami, rules, after)).toBe(false);
  });
});

describe("milestones", () => {
  const goal: Goal = {
    id: "g", title: "Area duduk", area: "Interior", pic: "nana", dueDate: "2027-01-31",
    milestones: [
      { id: "a", goalId: "g", title: "Moodboard", dueDate: "2026-09-25", pic: "nana", cost: 0, status: "jalan", statusBy: null, statusAt: null },
      { id: "b", goalId: "g", title: "Vendor", dueDate: "2026-10-25", pic: "mgr", cost: 0, status: "selesai", statusBy: null, statusAt: null },
      { id: "c", goalId: "g", title: "Interior", dueDate: "2026-12-15", pic: "nana", cost: 15_000_000, status: "belum", statusBy: null, statusAt: null },
    ],
  };
  it("computes late and progress", () => {
    expect(milestoneState(goal.milestones[0], "2026-10-26")).toBe("telat");
    expect(milestoneState(goal.milestones[1], "2026-10-26")).toBe("selesai");
    expect(milestoneState(goal.milestones[0], "2026-09-25")).toBe("jalan");
    expect(goalProgress(goal, "2026-10-26")).toEqual({ done: 1, total: 3, late: 1 });
  });
  it("cycles status and checks who may change it", () => {
    expect(["belum", "jalan", "selesai"].map((s) => nextMilestoneStatus(s as "belum"))).toEqual(["jalan", "selesai", "belum"]);
    expect(canUpdateMilestone("manager", "mgr", goal.milestones[1])).toBe(true);
    expect(canUpdateMilestone("manager", "mgr", goal.milestones[0])).toBe(false);
    expect(canUpdateMilestone("admin", "x", goal.milestones[0])).toBe(true);
    expect(canUpdateMilestone("produksi", "nana", goal.milestones[0])).toBe(false);
  });
  it("lists open milestones soonest first", () => {
    expect(openMilestones([goal]).map((x) => x.milestone.id)).toEqual(["a", "c"]);
    expect(openMilestones([goal], ["Produksi"])).toEqual([]);
  });
});

describe("targets", () => {
  const rows: MonthTargetRow[] = [
    { month: "2026-10-01", cafe: 130_000_000, preorder: 15_000_000, hampers: 10_000_000, web: 8_000_000, orders: 60, avgOrder: 350_000, foodCost: 35 },
    { month: "2026-12-01", cafe: 150_000_000, preorder: 20_000_000, hampers: 40_000_000, web: null, orders: 100, avgOrder: null, foodCost: 35 },
  ];
  it("inherits the previous month", () => {
    expect(monthTarget(rows, "2026-09").from).toBeNull();
    expect(monthTarget(rows, "2026-10")).toMatchObject({ own: true, from: "2026-10" });
    expect(monthTarget(rows, "2026-11")).toMatchObject({ own: false, from: "2026-10", values: { orders: 60 } });
    expect(monthTarget(rows, "2027-03").values.hampers).toBe(40_000_000);
  });
  it("sums the year unless Alto set it", () => {
    // Oct + Nov = 155 jt each, Dec = 210 jt.
    expect(yearTarget(rows, [], 2026)).toMatchObject({ revenue: 520_000_000, orders: 220, auto: true });
    expect(yearTarget(rows, [{ year: 2026, revenue: 600_000_000, orders: null }], 2026)).toMatchObject({ revenue: 600_000_000, orders: 220, auto: false });
  });
  it("splits sales and computes food cost", () => {
    const orders = [
      order({ fulfillDate: "2026-10-05", items: [{ productId: "croissant", qty: 2, unitPrice: 50_000, unitCost: 20_000 }] }),
      order({ fulfillDate: "2026-10-06", channel: "web", items: [{ productId: "box", qty: 1, unitPrice: 300_000 }], shippingFee: 20_000 }),
      order({ fulfillDate: "2026-10-07", status: "batal", items: [{ productId: "box", qty: 5, unitPrice: 300_000 }] }),
      order({ fulfillDate: "2026-11-01", items: [{ productId: "croissant", qty: 9, unitPrice: 50_000 }] }),
    ];
    const a = actuals(orders, "2026-10-01", "2026-10-31", (id) => id === "box", new Map([["box", 100_000]]));
    expect(a).toMatchObject({ cafe: null, preorder: 100_000, hampers: 300_000, web: 300_000, orders: 2, avgOrder: 200_000, estimatedItems: 1 });
    expect(a.foodCost).toBeCloseTo(35);
  });
  it("projects while the month runs", () => {
    expect(progress(50, 100, { elapsed: 10, total: 30 })).toEqual({ pct: 50, projection: 150, ok: true, bar: 50 });
    expect(progress(20, 100, { elapsed: 10, total: 30 }).ok).toBe(false);
    expect(progress(90, 100, { elapsed: 30, total: 30 })).toMatchObject({ projection: null, ok: false });
    expect(progress(29, 35, { lowerIsBetter: true })).toMatchObject({ ok: true, projection: null });
    expect(progress(10, null).pct).toBeNull();
    expect(progress(250, 100).bar).toBe(100);
  });
  it("handles month navigation", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(elapsedDays("2026-10", "2026-10-26")).toBe(26);
    expect(elapsedDays("2026-09", "2026-10-26")).toBe(30);
    expect(elapsedDays("2026-11", "2026-10-26")).toBe(0);
  });
});

describe("time", () => {
  it("shows both clocks", async () => {
    const { dualTime, ago } = await import("./time");
    expect(dualTime(Date.parse("2026-10-27T08:20:00Z"))).toBe("Sel, 27 Okt, 15:20 WIB · 09:20 Jerman");
    const now = Date.parse("2026-10-27T08:20:00Z");
    expect(ago(now - 30 * 60_000, now)).toBe("baru saja");
    expect(ago(now - 5 * 3_600_000, now)).toBe("5 jam lalu");
    expect(ago(now - 50 * 3_600_000, now)).toBe("2 hari lalu");
  });
});
