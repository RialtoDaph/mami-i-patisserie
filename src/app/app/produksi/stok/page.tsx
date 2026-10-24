import type { Metadata } from "next";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { countUnit, stockState, todayJakarta, type StockState } from "@/lib/preorder";
import { INGREDIENT_CATEGORY_LABEL } from "@/lib/labels";
import { formatNumber } from "@/lib/format";
import { Panel, SectionLabel } from "@/components/app/ui";
import { ProductionTabs } from "../ProductionTabs";
import { StockRow, type StockRowView } from "./StockRow";

export const metadata: Metadata = { title: "Stok bahan" };

const ORDER: Record<StockState, number> = { kurang: 0, belum_dihitung: 1, cukup: 2, tanpa_minimum: 3 };

export default async function StockPage() {
  const [user, costing] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const canEdit = can(user.role, "ingredient.edit");
  const today = todayJakarta();
  const rows: StockRowView[] = costing.ingredients.map((i) => {
    const { factor, label } = countUnit(i.baseUnit);
    const show = (base: number | null) => (base == null ? "" : formatNumber(base / factor, 3));
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      supplier: i.supplier,
      unitLabel: label,
      packSize: factor,
      stock: show(i.stockQty),
      min: show(i.minStock),
      state: stockState(i),
      countedAt: i.stockCountedAt,
      isDummy: i.isDummy,
    };
  });
  const low = rows.filter((r) => r.state === "kurang").length;
  const uncounted = rows.filter((r) => r.state === "belum_dihitung").length;

  return (
    <div className="flex flex-col gap-4">
      <ProductionTabs active="stok" />
      <p className="text-[15px] text-brand-muted">
        Hitung stok dapur secara manual, lalu simpan. Daftar belanja otomatis dikurangi stok ini. Kasir dan stok jual tetap di
        Majoo. {low > 0 && <b className="text-brand-wine">{low} bahan di bawah minimum.</b>} {uncounted > 0 && <span>{uncounted} belum pernah dihitung.</span>}
      </p>
      {(["bahan", "kemasan"] as const).map((cat) => {
        const list = rows.filter((r) => r.category === cat).sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.name.localeCompare(b.name));
        if (!list.length) return null;
        return (
          <section key={cat} className="flex flex-col gap-2">
            <SectionLabel>{INGREDIENT_CATEGORY_LABEL[cat]}</SectionLabel>
            <Panel className="overflow-hidden">
              {list.map((r, n) => (
                <StockRow key={r.id} row={r} first={n === 0} canEdit={canEdit} today={today} />
              ))}
            </Panel>
          </section>
        );
      })}
    </div>
  );
}
