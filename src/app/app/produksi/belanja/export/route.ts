import { getCurrentUser, loadCostingData } from "@/lib/data";
import { loadPreorderData } from "@/lib/preorderData";
import { toCsv } from "@/lib/csv";
import { buyLabel, CATEGORY_TITLE, todayJakarta } from "@/lib/preorder";
import { parseShoppingParams } from "@/lib/shoppingParams";
import { buildShoppingList } from "../../shopping";

// CSV export of the shopping list with the same options as the page.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user.role) return new Response("Forbidden", { status: 403 });

  const p = parseShoppingParams(Object.fromEntries(new URL(request.url).searchParams), todayJakarta());
  const [pre, costing] = await Promise.all([loadPreorderData(), loadCostingData()]);
  const list = buildShoppingList(pre, costing, p);

  const csv = toCsv([
    ["Kategori", "Supplier", "Bahan", "Kebutuhan", "Satuan", "Beli", "Estimasi belanja (Rp)", "Nilai terpakai (Rp)"],
    ...list.groups.flatMap((g) =>
      g.suppliers.flatMap((s) =>
        s.rows.map((r) => [
          CATEGORY_TITLE[g.category], s.supplier ?? "", r.name, r.needQty.toFixed(r.baseUnit === "pcs" ? 1 : 0), r.baseUnit,
          buyLabel(r), Math.round(r.buyCost), Math.round(r.useCost),
        ]),
      ),
    ),
    ["", "", "Total", "", "", "", Math.round(list.totalBuy), Math.round(list.totalUse)],
  ]);

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="belanja-${p.from}_${p.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
