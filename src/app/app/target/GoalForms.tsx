"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteGoal, deleteMilestone, saveGoal, saveMilestone, type SavedResult } from "@/lib/planActions";
import { GOAL_AREAS, type Goal, type Milestone } from "@/lib/plans";
import { Icon } from "@/components/brand";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { AppField, FormMessage, NumberInput, inputClass } from "@/components/app/form";

interface Person {
  id: string;
  name: string;
}

const saveButton = "inline-flex min-h-12 items-center justify-center rounded-md bg-brand-wine px-5 text-[15px] font-bold text-brand-butter disabled:opacity-60";
const deleteButton = "min-h-12 px-3 text-[15px] font-bold text-brand-wine";
const iconButton = "flex size-10 flex-none items-center justify-center rounded-md text-brand-muted hover:bg-brand-butter";

/** Bottom sheet on phones, centred dialog on wider screens. Escape closes. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-espresso/40 nav:items-center nav:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-xl bg-brand-butter-50 p-5 nav:max-w-[560px] nav:rounded-md"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className={iconButton}>
            <Icon name="close" size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useSheetAction(action: (prev: SavedResult, fd: FormData) => Promise<SavedResult>) {
  const [open, setOpen] = useState(false);
  const [state, run, pending] = useActionState<SavedResult, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (!res.error) setOpen(false);
    return res;
  }, {});
  return { open, setOpen, state, run, pending };
}

function PicSelect({ people, value }: { people: Person[]; value?: string | null }) {
  return (
    <select name="pic" defaultValue={value ?? ""} className={`${inputClass} appearance-auto`}>
      <option value="">Belum ada</option>
      {people.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

export function GoalForm({ people, goal, defaultPic }: { people: Person[]; goal?: Goal; defaultPic?: string }) {
  const s = useSheetAction(saveGoal);
  const year = new Date().getFullYear();
  return (
    <>
      {goal ? (
        <button type="button" onClick={() => s.setOpen(true)} aria-label={`Ubah goal ${goal.title}`} className={iconButton}>
          <Icon name="edit" size={20} />
        </button>
      ) : (
        <button type="button" onClick={() => s.setOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-brand-wine px-4 text-[15px] font-bold text-brand-butter">
          <Icon name="add" size={20} />
          Goal baru
        </button>
      )}
      {s.open && (
        <Sheet title={goal ? "Ubah goal" : "Goal baru"} onClose={() => s.setOpen(false)}>
          <form action={s.run} className="flex flex-col gap-3">
            {goal && <input type="hidden" name="id" value={goal.id} />}
            <AppField label="Nama goal">
              <input name="title" required maxLength={200} defaultValue={goal?.title} placeholder="mis. Hampers Lebaran 2027 terjual 150 box" className={inputClass} />
            </AppField>
            <div className="grid gap-3 nav:grid-cols-2">
              <AppField label="Area">
                <select name="area" defaultValue={goal?.area ?? "Marketing"} className={`${inputClass} appearance-auto`}>
                  {GOAL_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </AppField>
              <AppField label="PIC">
                <PicSelect people={people} value={goal?.pic ?? defaultPic} />
              </AppField>
            </div>
            <AppField label="Target tanggal">
              <input type="date" name="due_date" required defaultValue={goal?.dueDate ?? `${year}-12-31`} className={inputClass} />
            </AppField>
            <FormMessage error={s.state.error} />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <button type="submit" disabled={s.pending} className={saveButton}>{s.pending ? "Menyimpan…" : "Simpan goal"}</button>
              {goal && (
                <ConfirmActionButton
                  action={() => deleteGoal(goal.id)}
                  confirmText={`Hapus goal "${goal.title}" beserta semua milestone-nya?`}
                  label="Hapus goal"
                  pendingLabel="Menghapus…"
                  className={deleteButton}
                />
              )}
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}

export function MilestoneForm({
  people, goalId, milestone, defaultPic, defaultDate,
}: {
  people: Person[];
  goalId: string;
  milestone?: Milestone;
  defaultPic?: string | null;
  defaultDate?: string;
}) {
  const s = useSheetAction(saveMilestone);
  return (
    <>
      {milestone ? (
        <button type="button" onClick={() => s.setOpen(true)} aria-label={`Ubah milestone ${milestone.title}`} className={iconButton}>
          <Icon name="edit" size={18} />
        </button>
      ) : (
        <button type="button" onClick={() => s.setOpen(true)} className="mt-1 inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-bold text-brand-wine">
          <Icon name="add" size={20} />
          Tambah milestone
        </button>
      )}
      {s.open && (
        <Sheet title={milestone ? "Ubah milestone" : "Milestone baru"} onClose={() => s.setOpen(false)}>
          <form action={s.run} className="flex flex-col gap-3">
            <input type="hidden" name="goal_id" value={goalId} />
            {milestone && <input type="hidden" name="id" value={milestone.id} />}
            <AppField label="Nama milestone">
              <input name="title" required maxLength={200} defaultValue={milestone?.title} placeholder="mis. Foto produk hampers" className={inputClass} />
            </AppField>
            <div className="grid gap-3 nav:grid-cols-2">
              <AppField label="Tanggal">
                <input type="date" name="due_date" required defaultValue={milestone?.dueDate ?? defaultDate} className={inputClass} />
              </AppField>
              <AppField label="PIC">
                <PicSelect people={people} value={milestone ? milestone.pic : defaultPic} />
              </AppField>
            </div>
            <AppField label="Biaya (Rp, opsional)" hint="Kalau ada biaya, PIC bisa mengajukannya ke Persetujuan.">
              <NumberInput name="cost" defaultValue={milestone?.cost || null} placeholder="0" />
            </AppField>
            <FormMessage error={s.state.error} />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <button type="submit" disabled={s.pending} className={saveButton}>{s.pending ? "Menyimpan…" : "Simpan milestone"}</button>
              {milestone && (
                <ConfirmActionButton
                  action={() => deleteMilestone(milestone.id)}
                  confirmText={`Hapus milestone "${milestone.title}"?`}
                  label="Hapus"
                  pendingLabel="Menghapus…"
                  className={deleteButton}
                />
              )}
            </div>
          </form>
        </Sheet>
      )}
    </>
  );
}
