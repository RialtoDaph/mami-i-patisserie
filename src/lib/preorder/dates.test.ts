import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDateId, isIsoDate, todayJakarta, weekStart } from "./dates";

describe("dates", () => {
  it("uses Jakarta time for today", () => {
    // 2026-09-27 18:30 UTC is already 28 Sep 01:30 in Jakarta (UTC+7).
    expect(todayJakarta(new Date("2026-09-27T18:30:00Z"))).toBe("2026-09-28");
    expect(todayJakarta(new Date("2026-09-27T16:59:00Z"))).toBe("2026-09-27");
  });
  it("finds the Monday of the week (Mon–Sun)", () => {
    expect(weekStart("2026-10-05")).toBe("2026-10-05"); // Monday
    expect(weekStart("2026-10-11")).toBe("2026-10-05"); // Sunday
    expect(weekStart("2026-10-12")).toBe("2026-10-12");
    expect(weekStart("2027-03-01")).toBe("2027-03-01");
  });
  it("does date arithmetic across months and years", () => {
    expect(addDays("2027-02-27", 2)).toBe("2027-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2027-01-15", "2027-03-03")).toBe(47);
  });
  it("formats in Indonesian", () => {
    expect(formatDateId("2027-03-10")).toBe("Rab, 10 Mar 2027");
    expect(formatDateId("2027-08-17", false)).toBe("17 Agu 2027");
  });
  it("validates ISO dates", () => {
    expect(isIsoDate("2027-02-28")).toBe(true);
    expect(isIsoDate("2027-02-30")).toBe(false);
    expect(isIsoDate("")).toBe(false);
  });
});
