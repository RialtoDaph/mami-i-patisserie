import { describe, expect, it } from "vitest";
import { buildNav, greetLine, homeFor, tabForPath, tabsForRole } from "./appNav";

describe("tabsForRole", () => {
  it("gives owners and admins every tab", () => {
    expect(tabsForRole("owner")).toHaveLength(14);
    expect(tabsForRole("admin")).toEqual(tabsForRole("owner"));
  });
  it("limits the pastry chef, manager and crew", () => {
    expect(tabsForRole("produksi")).toEqual(["beranda", "order", "produksi", "tim", "alat"]);
    expect(tabsForRole("manager")).toEqual(["kafe", "mingguan", "target", "tim", "setuju", "alat"]);
    expect(tabsForRole("crew")).toEqual(["tim", "alat"]);
    expect(tabsForRole(null)).toEqual([]);
  });
});

describe("tabForPath", () => {
  it("maps app paths to tabs", () => {
    expect(tabForPath("/app")).toBe("beranda");
    expect(tabForPath("/app/order/123")).toBe("order");
    expect(tabForPath("/app/produksi/belanja")).toBe("produksi");
    expect(tabForPath("/app/resep/9/ubah")).toBe("costing");
    expect(tabForPath("/app/pengaturan")).toBe("lainnya");
    expect(tabForPath("/app/lainnya/akun")).toBe("lainnya");
    expect(tabForPath("/app/orderx")).toBeNull();
  });
});

describe("buildNav", () => {
  it("shows 6 groups with pill tabs for owners", () => {
    const nav = buildNav(tabsForRole("owner"), "produksi");
    expect(nav.groups.map((g) => g.label)).toEqual(["Beranda", "Order", "Kafe", "Uang", "Tim", "Lainnya"]);
    expect(nav.groups.find((g) => g.active)?.label).toBe("Order");
    expect(nav.subTabs.map((s) => [s.label, s.active])).toEqual([["Order", false], ["Produksi", true]]);
    expect(nav.title).toBe("Produksi");
  });
  it("uses the tab's own icon and label when a group has one tab for this person", () => {
    const nav = buildNav(tabsForRole("crew"), "tim");
    expect(nav.groups.map((g) => [g.label, g.icon, g.href])).toEqual([
      ["Tim", "badge", "/app/tim"],
      ["Alat", "handyman", "/app/alat"],
    ]);
    expect(nav.subTabs).toEqual([]);
  });
  it("keeps Legal and Konten out of the pill tabs", () => {
    const nav = buildNav(tabsForRole("owner"), "legal");
    expect(nav.subTabs.map((s) => s.label)).toEqual(["Menu lain", "Alat"]);
    expect(nav.groups.find((g) => g.active)?.label).toBe("Lainnya");
  });
  it("remembers the last tab per group", () => {
    const nav = buildNav(tabsForRole("owner"), "beranda", { uang: "target" });
    expect(nav.groups.find((g) => g.key === "uang")?.href).toBe("/app/target");
  });
});

describe("homeFor", () => {
  it("lands each role on its first tab", () => {
    expect(homeFor("owner")).toBe("/app");
    expect(homeFor("manager")).toBe("/app/kafe");
    expect(homeFor("crew")).toBe("/app/tim");
  });
});

describe("greetLine", () => {
  it("shows the date and the countdown to the next campaign", () => {
    expect(greetLine("2026-09-28", { name: "Natal 2026", endIso: "2026-12-24" })).toBe("Sen 28 Sep · 87 hari ke Natal 2026");
    expect(greetLine("2026-12-24", { name: "Natal 2026", endIso: "2026-12-24" })).toBe("Kam 24 Des · hari ini Natal 2026");
    expect(greetLine("2026-10-24", null)).toBe("Sab 24 Okt");
  });
});

describe("menu search words", () => {
  it("lets Ctrl K find Tim by 'gaji'", () => {
    const tim = buildNav(tabsForRole("owner"), "beranda").allMenu.flatMap((g) => g.items).find((i) => i.key === "tim");
    expect(tim?.search).toContain("gaji");
  });
});
