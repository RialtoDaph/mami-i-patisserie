"use client";

import { useEffect, useState, useTransition } from "react";
import { setMilestoneStatus } from "@/lib/planActions";
import { MILESTONE_LABEL, nextMilestoneStatus, type MilestoneStatus } from "@/lib/plans";
import { Icon, type IconName } from "@/components/brand";

const STYLE: Record<MilestoneStatus | "telat", { cls: string; icon: IconName }> = {
  belum: { cls: "border-[1.5px] border-brand-espresso/25 bg-white text-brand-muted", icon: "radio_button_unchecked" },
  jalan: { cls: "bg-brand-butter text-brand-espresso", icon: "pending" },
  selesai: { cls: "bg-brand-pistachio-50 text-brand-olive", icon: "check_circle" },
  telat: { cls: "bg-brand-wine-50 text-brand-wine", icon: "error" },
};

/** Status pill. Tap once to arm ("Ketuk lagi: …"), tap again within 4 s to change. */
export function MilestoneStatusButton({ id, status, late, canUpdate }: { id: string; status: MilestoneStatus; late: boolean; canUpdate: boolean }) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  const next = nextMilestoneStatus(status);
  const s = STYLE[late ? "telat" : status];
  const label = armed ? `Ketuk lagi: ${MILESTONE_LABEL[next]}` : late ? `Telat · ${MILESTONE_LABEL[status].toLowerCase()}` : MILESTONE_LABEL[status];
  const cls = armed ? "bg-brand-espresso text-brand-butter" : s.cls;
  const body = (
    <>
      <Icon name={armed ? "touch_app" : s.icon} size={16} />
      {pending ? "Menyimpan…" : label}
    </>
  );
  const base = `inline-flex min-h-10 flex-none items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${cls}`;
  if (!canUpdate) return <span className={base}>{body}</span>;
  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        aria-label={`Status ${MILESTONE_LABEL[status]}. ${armed ? `Ketuk lagi untuk ${MILESTONE_LABEL[next]}` : "Ketuk dua kali untuk mengganti"}`}
        onClick={() => {
          if (!armed) return setArmed(true);
          setArmed(false);
          start(async () => setError((await setMilestoneStatus(id, next)).error ?? ""));
        }}
        className={base}
      >
        {body}
      </button>
      {error && <span role="alert" className="mt-1 max-w-[200px] text-right text-xs font-semibold text-brand-wine">{error}</span>}
    </span>
  );
}
