import Link from "next/link";
import type { CurrentUser } from "@/lib/data";
import type { PlansData } from "@/lib/plansData";
import { can } from "@/lib/permissions";
import { formatDateId } from "@/lib/preorder";
import { canUpdateMilestone, GOAL_AREAS, goalProgress, milestoneState } from "@/lib/plans";
import { formatRupiah } from "@/lib/format";
import { Icon } from "@/components/brand";
import { ChipLink, EmptyNote, Panel } from "@/components/app/ui";
import { targetHref, type TargetParams } from "./params";
import { GoalForm, MilestoneForm } from "./GoalForms";
import { MilestoneStatusButton } from "./MilestoneStatusButton";

const short = (iso: string) => formatDateId(iso, false).replace(/ \d{4}$/, "");

export function GoalsView({ params, today, user, plans }: { params: TargetParams; today: string; user: CurrentUser; plans: PlansData }) {
  const isAlto = can(user.role, "plans.manage");
  const names = new Map(plans.team.map((t) => [t.id, t.name]));
  const people = plans.team.filter((t) => t.role && t.role !== "crew").map((t) => ({ id: t.id, name: t.name }));
  const areas = GOAL_AREAS.filter((a) => plans.goals.some((g) => g.area === a));
  const area = params.area && areas.includes(params.area as (typeof GOAL_AREAS)[number]) ? params.area : null;
  // Goals where I am PIC (of the goal or a milestone) come first, then by target date.
  const mine = (g: PlansData["goals"][number]) => g.pic === user.id || g.milestones.some((m) => m.pic === user.id);
  const goals = plans.goals
    .filter((g) => !area || g.area === area)
    .sort((a, b) => Number(mine(b)) - Number(mine(a)) || a.dueDate.localeCompare(b.dueDate));
  const approvalOf = new Map(plans.approvals.filter((a) => a.milestoneId).map((a) => [a.milestoneId!, a]));
  const canAsk = can(user.role, "approval.submit") && !isAlto;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="no-scrollbar -mx-3.5 flex gap-2 overflow-x-auto px-3.5 nav:mx-0 nav:px-0">
          <ChipLink href={targetHref({ v: "goals" })} active={!area}>Semua</ChipLink>
          {areas.map((a) => (
            <ChipLink key={a} href={targetHref({ v: "goals", area: a })} active={area === a}>{a}</ChipLink>
          ))}
        </div>
        {isAlto && <GoalForm people={people} defaultPic={user.id} />}
      </div>
      <p className="text-[13px] text-brand-muted">
        {user.role === "manager" ? "Kamu bisa ganti status milestone yang PIC-nya kamu. Goal diatur Alto. " : ""}
        Ketuk status dua kali untuk mengganti.
      </p>

      {goals.length === 0 ? (
        <EmptyNote>{isAlto ? "Belum ada goal. Tekan “Goal baru”." : "Belum ada goal dari Alto."}</EmptyNote>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,420px),1fr))] items-start gap-3">
          {goals.map((g) => {
            const p = goalProgress(g, today);
            return (
              <Panel key={g.id} className="flex flex-col px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[.14em] text-brand-pistachio-deep uppercase">{g.area}</p>
                    <h3 className="font-display text-[18px] leading-snug font-bold">{g.title}</h3>
                    <p className="text-[13px] text-brand-muted">PIC {(g.pic && names.get(g.pic)) || "–"} · target {formatDateId(g.dueDate, false)}</p>
                  </div>
                  {isAlto && <GoalForm people={people} goal={g} />}
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-brand-espresso/10">
                    <span className={`block h-full rounded-full ${p.late ? "bg-brand-wine" : "bg-brand-olive"}`} style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
                  </span>
                  <span className="text-[13px] font-bold whitespace-nowrap">{p.done} / {p.total} milestone</span>
                  {p.late > 0 && <span className="text-xs font-bold whitespace-nowrap text-brand-wine">{p.late} telat</span>}
                </div>
                <ul className="mt-2">
                  {g.milestones.map((m, i) => {
                    const st = milestoneState(m, today);
                    const ap = approvalOf.get(m.id);
                    const mayUpdate = canUpdateMilestone(user.role, user.id, m);
                    const askHref = `/app/setuju?${new URLSearchParams({
                      ajukan: "1", jenis: "alat", judul: `${g.title}: ${m.title}`.slice(0, 200), nominal: String(m.cost), milestone: m.id,
                      catatan: `Milestone di Target & Rencana, jadwal ${formatDateId(m.dueDate, false)}.`,
                    })}`;
                    const changedBy = m.statusBy && m.statusAt ? ` · diubah ${names.get(m.statusBy) ?? "?"} ${short(m.statusAt.slice(0, 10))}` : "";
                    return (
                      <li key={m.id} className={`flex flex-col gap-1 py-2.5 ${i ? "border-t border-brand-espresso/8" : ""}`}>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-[15px] leading-snug font-bold ${m.status === "selesai" ? "line-through" : ""}`}>{m.title}</p>
                            <p className="text-[13px] text-brand-muted">
                              {formatDateId(m.dueDate, false)} · {(m.pic && names.get(m.pic)) || "–"}
                              {m.cost > 0 && ` · ${formatRupiah(m.cost)}`}
                              {changedBy}
                            </p>
                          </div>
                          <MilestoneStatusButton id={m.id} status={m.status} late={st === "telat"} canUpdate={mayUpdate} />
                          {isAlto && <MilestoneForm people={people} goalId={g.id} milestone={m} />}
                        </div>
                        {ap ? (
                          <p className={`text-xs font-bold ${ap.status === "ditolak" ? "text-brand-wine" : ap.status === "disetujui" ? "text-brand-olive" : "text-brand-pistachio-deep"}`}>
                            {ap.status === "menunggu" ? "Biaya menunggu Alto" : ap.status === "disetujui" ? "Biaya disetujui" : ap.status === "ditolak" ? "Biaya ditolak" : "Biaya dicatat"}
                          </p>
                        ) : (
                          m.cost > 0 && m.status !== "selesai" && canAsk && mayUpdate && (
                            <Link href={askHref} className="inline-flex min-h-9 items-center gap-1 self-start text-[13px] font-bold text-brand-wine">
                              <Icon name="approval" size={16} />
                              Ajukan biaya ke Persetujuan
                            </Link>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
                {isAlto && <MilestoneForm people={people} goalId={g.id} defaultPic={g.pic} defaultDate={today} />}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
