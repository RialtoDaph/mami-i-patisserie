"use client";

import { useActionState, useState, useTransition } from "react";
import { addPerson, registerDevice, revokeDevice, savePerson } from "@/lib/teamAuth";
import type { ActionResult } from "@/lib/actions";
import type { AppRole } from "@/lib/permissions";
import { Button, Field, Icon, Input, Select } from "@/components/brand";
import { SubmitButton } from "@/components/SubmitButton";

export interface PersonView {
  id: string;
  fullName: string;
  title: string;
  role: AppRole | null;
  isActive: boolean;
  hasPin: boolean;
  locked: boolean;
  isMe: boolean;
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "owner", label: "Owner + keuangan (Alto)" },
  { value: "admin", label: "Owner (semua menu)" },
  { value: "produksi", label: "Produksi (pastry chef)" },
  { value: "manager", label: "Manager kafe" },
  { value: "crew", label: "Crew (barista, waiter, part-time)" },
];

const roleLabel = (r: AppRole | null) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? "Belum ada akses";
const submitClass = "inline-flex min-h-12 items-center justify-center rounded-md bg-brand-wine px-5 text-[15px] font-bold text-brand-butter disabled:opacity-50";

function Notice({ state }: { state: ActionResult & { ok?: boolean } }) {
  if (state.error) return <p role="alert" className="text-sm font-semibold text-brand-wine">{state.error}</p>;
  return null;
}

function PersonFields({ person }: { person?: PersonView }) {
  return (
    <div className="grid gap-3 nav:grid-cols-2">
      <Field tone="app" label="Nama">
        <Input tone="app" name="full_name" defaultValue={person?.fullName} required maxLength={60} />
      </Field>
      <Field tone="app" label="Keterangan" hint="mis. Owner, Barista">
        <Input tone="app" name="title" defaultValue={person?.title} maxLength={40} />
      </Field>
      <Field tone="app" label="Peran">
        <Select tone="app" name="role" defaultValue={person?.role ?? ""} required={!person} disabled={person?.isMe}>
          {!person?.role && <option value="">Pilih…</option>}
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
        {person?.isMe && <input type="hidden" name="role" value="owner" />}
      </Field>
      <Field tone="app" label={person?.hasPin ? "PIN baru" : "PIN"} hint={person?.hasPin ? "kosongkan kalau tidak diganti" : "4 angka"}>
        <Input tone="app" name="pin" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" required={!person} placeholder="••••" />
      </Field>
    </div>
  );
}

export function PersonRow({ person, first }: { person: PersonView; first: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionResult, FormData>(async (prev, fd) => {
    const res = await savePerson(prev, fd);
    if (!res.error) setOpen(false);
    return res;
  }, {});
  return (
    <div className={first ? "" : "border-t border-brand-espresso/10"}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3.5 px-4 text-left hover:bg-brand-butter">
        <span className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-butter font-display text-[17px] font-bold text-brand-wine">
          {(person.fullName || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <b className={`block text-[15px] ${person.isActive ? "" : "text-brand-muted line-through"}`}>{person.fullName || "(tanpa nama)"}</b>
          <span className="block text-[13px] text-brand-muted">
            {person.title || roleLabel(person.role)} · {person.locked ? "PIN terkunci 15 menit" : person.hasPin ? "PIN ada" : "belum ada PIN"}
            {!person.isActive && " · nonaktif"}
          </span>
        </span>
        <Icon name={open ? "keyboard_arrow_down" : "chevron_right"} size={22} className="text-brand-muted" />
      </button>
      {open && (
        <form action={action} className="flex flex-col gap-3 border-t border-dashed border-brand-espresso/20 px-4 pt-3 pb-4">
          <input type="hidden" name="id" value={person.id} />
          <PersonFields person={person} />
          <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
            <input type="checkbox" name="is_active" defaultChecked={person.isActive} disabled={person.isMe} className="size-5 accent-brand-wine" />
            Aktif (bisa masuk)
            {person.isMe && <input type="hidden" name="is_active" value="on" />}
          </label>
          <Notice state={state} />
          <div className="flex gap-2">
            <SubmitButton className={submitClass}>Simpan</SubmitButton>
            <Button variant="ghost" shape="rect" size="md" onClick={() => setOpen(false)}>Batal</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function AddPersonForm({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [state, action] = useActionState<ActionResult, FormData>(async (prev, fd) => {
    const res = await addPerson(prev, fd);
    if (!res.error) {
      setOpen(false);
      setKey((k) => k + 1);
    }
    return res;
  }, {});
  if (!open) {
    return (
      <Button variant="outline" shape="rect" size="md" icon="person_add" className="self-start" onClick={() => setOpen(true)} disabled={disabled}>
        Tambah orang
      </Button>
    );
  }
  return (
    <form key={key} action={action} className="flex flex-col gap-3 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 p-[18px]">
      <h3 className="font-display text-base font-bold">Tambah orang</h3>
      <p className="text-sm text-brand-muted">Orang baru masuk dengan nama + PIN di perangkat terdaftar. Email tidak perlu.</p>
      <PersonFields />
      <Notice state={state} />
      <div className="flex gap-2">
        <SubmitButton className={submitClass}>Tambah</SubmitButton>
        <Button variant="ghost" shape="rect" size="md" onClick={() => setOpen(false)}>Batal</Button>
      </div>
    </form>
  );
}

export function DeviceForm() {
  const [state, action] = useActionState<ActionResult, FormData>(registerDevice, {});
  return (
    <form action={action} className="flex flex-col gap-3 nav:flex-row nav:items-end">
      <Field tone="app" label="Nama perangkat" className="flex-1">
        <Input tone="app" name="name" placeholder="mis. Tablet kafe, HP Mami" required maxLength={60} />
      </Field>
      <SubmitButton className={submitClass}>Daftarkan perangkat ini</SubmitButton>
      <Notice state={state} />
    </form>
  );
}

export function RevokeDeviceButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cabut perangkat ini? Login PIN di perangkat ini berhenti.")) return;
          start(async () => setError((await revokeDevice(id)).error ?? null));
        }}
        className="min-h-11 rounded-md px-3 text-sm font-bold text-brand-wine disabled:opacity-50"
      >
        {pending ? "Mencabut…" : "Cabut"}
      </button>
      {error && <span className="text-xs text-brand-wine">{error}</span>}
    </span>
  );
}
