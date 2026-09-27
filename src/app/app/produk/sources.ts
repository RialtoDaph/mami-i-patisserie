import "server-only";
import type { FullCostingData } from "@/lib/data";
import { RECIPE_CATEGORY_LABEL } from "@/lib/labels";
import type { SourceOption } from "./ProductForm";

export function sourceOptions(costing: FullCostingData): SourceOption[] {
  return [
    ...costing.recipes
      .filter((r) => r.category !== "sub_resep")
      .map((r) => ({ ref: `r:${r.id}`, name: r.name, unit: r.yieldUnit, group: `Resep · ${RECIPE_CATEGORY_LABEL[r.category]}` })),
    ...costing.bundles.map((b) => ({ ref: `b:${b.id}`, name: b.name, unit: "paket", group: "Paket" })),
    ...costing.recipes
      .filter((r) => r.category === "sub_resep")
      .map((r) => ({ ref: `r:${r.id}`, name: r.name, unit: r.yieldUnit, group: "Isian / sub-resep" })),
  ];
}
