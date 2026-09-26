// UI-side permission checks. The database (RLS + triggers) is the real enforcement;
// these only decide what to show. Keep in sync with 20260926000003_rls_and_rpc.sql.

export type AppRole = "owner" | "admin" | "produksi" | "manager";

export type Action =
  | "ingredient.edit"
  | "ingredient.delete"
  | "recipe.edit"
  | "recipe.editPricing"
  | "recipe.delete"
  | "bundle.edit";

const RULES: Record<Action, AppRole[]> = {
  "ingredient.edit": ["owner", "admin", "produksi"],
  "ingredient.delete": ["owner", "admin"],
  "recipe.edit": ["owner", "admin", "produksi"],
  "recipe.editPricing": ["owner", "admin"],
  "recipe.delete": ["owner", "admin"],
  "bundle.edit": ["owner", "admin"],
};

export function can(role: AppRole | null, action: Action): boolean {
  return role != null && RULES[action].includes(role);
}
