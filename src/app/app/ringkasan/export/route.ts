import { buildSummary } from "@/lib/costing";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { toCsv } from "@/lib/csv";
import { RECIPE_CATEGORY_LABEL } from "@/lib/labels";
import { parseSummaryParams } from "@/lib/summaryParams";

// CSV export of the summary page, using the same filters/options.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user.role) return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const params = parseSummaryParams(Object.fromEntries(url.searchParams));
  const data = await loadCostingData();
  const rows = buildSummary(data, params).filter((r) => params.filter === "semua" || r.category === params.filter);

  const round = (n: number | null, d = 0) => (n == null ? "" : n.toFixed(d));
  const priceLabel = params.includePbjt ? " (termasuk PBJT 10%)" : "";
  const csv = toCsv([
    [
      "Jenis", "Nama", "Kategori", "Satuan", "Biaya per satuan (Rp)", `Harga jual${priceLabel} (Rp)`,
      "Harga jual sebelum pajak (Rp)", "HPP (%)", "Target HPP (%)", "Status", "Margin kotor (Rp)",
      `Saran harga${priceLabel} (Rp)`, "Catatan",
    ],
    ...rows.map((r) => [
      r.kind === "bundle" ? "Paket" : "Resep",
      r.name,
      r.kind === "bundle" ? "Paket" : RECIPE_CATEGORY_LABEL[r.category as keyof typeof RECIPE_CATEGORY_LABEL],
      r.unit,
      round(r.cost),
      round(r.displayPrice),
      round(r.sellingPrice),
      round(r.hppPct, 1),
      r.targetHppPct,
      r.status === "over" ? "Di atas target" : r.status === "under" ? "Di bawah target" : "Belum ada harga",
      round(r.margin),
      round(r.suggestedPrice),
      r.error ?? "",
    ]),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens UTF-8 correctly.
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ringkasan-hpp-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
