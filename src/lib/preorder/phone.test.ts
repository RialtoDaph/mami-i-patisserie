import { describe, expect, it } from "vitest";
import { formatWhatsapp, normalizeWhatsapp } from "./phone";

describe("normalizeWhatsapp", () => {
  it("accepts common Indonesian formats", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("6281234567890")).toBe("6281234567890");
    expect(normalizeWhatsapp("81234567890")).toBe("6281234567890");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeWhatsapp("")).toBeNull();
    expect(normalizeWhatsapp("12345")).toBeNull();
    expect(normalizeWhatsapp("+49 151 23456789")).toBeNull();
  });
  it("formats for display", () => {
    expect(formatWhatsapp("6281234567890")).toBe("0812-3456-7890");
  });
});
