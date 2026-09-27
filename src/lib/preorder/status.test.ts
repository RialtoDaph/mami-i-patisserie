import { describe, expect, it } from "vitest";
import { isOpen, nextStatus } from "./status";

describe("nextStatus", () => {
  it("walks the normal flow", () => {
    expect(nextStatus("baru", "ambil")).toBe("menunggu_dp");
    expect(nextStatus("menunggu_dp", "ambil")).toBe("dp_diterima");
    expect(nextStatus("dp_diterima", "ambil")).toBe("diproduksi");
    expect(nextStatus("diproduksi", "ambil")).toBe("siap");
    expect(nextStatus("siap", "ambil")).toBe("selesai");
    expect(nextStatus("siap", "ekspedisi")).toBe("dikirim");
    expect(nextStatus("dikirim", "kirim_instan")).toBe("selesai");
    expect(nextStatus("selesai", "ambil")).toBeNull();
    expect(nextStatus("batal", "ambil")).toBeNull();
    expect(isOpen("siap")).toBe(true);
    expect(isOpen("batal")).toBe(false);
  });
});
