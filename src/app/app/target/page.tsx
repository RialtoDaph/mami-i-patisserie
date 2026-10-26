import type { Metadata } from "next";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { loadPreorderData } from "@/lib/preorderData";
import { loadPlans } from "@/lib/plansData";
import { todayJakarta } from "@/lib/preorder";
import { LocalTabs } from "@/components/app/ui";
import { readTargetParams, targetHref } from "./params";
import { TargetNumbers } from "./TargetNumbers";
import { GoalsView } from "./GoalsView";
import { RoadmapView } from "./RoadmapView";

export const metadata: Metadata = { title: "Target & Rencana" };

export default async function TargetPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const today = todayJakarta();
  const params = readTargetParams(await searchParams, today);
  const [user, plans, pre] = await Promise.all([getCurrentUser(), loadPlans(), loadPreorderData()]);
  return (
    <div className="mx-auto flex max-w-[1090px] flex-col gap-3.5">
      <LocalTabs
        items={[
          { href: targetHref({ v: "target" }), label: "Target", icon: "flag", active: params.v === "target" },
          { href: targetHref({ v: "goals" }), label: "Goals & milestone", icon: "task_alt", active: params.v === "goals" },
          { href: targetHref({ v: "roadmap" }), label: "Roadmap", icon: "calendar_month", active: params.v === "roadmap" },
        ]}
      />
      {params.v === "target" && <TargetNumbers params={params} today={today} user={user} plans={plans} pre={pre} costing={await loadCostingData()} />}
      {params.v === "goals" && <GoalsView params={params} today={today} user={user} plans={plans} />}
      {params.v === "roadmap" && <RoadmapView params={params} today={today} plans={plans} pre={pre} />}
    </div>
  );
}
