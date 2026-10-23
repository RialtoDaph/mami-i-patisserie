"use client";

import { useEffect, useState, useTransition } from "react";
import { pinLogin } from "@/lib/teamAuth";
import type { PinPerson } from "@/lib/teamDevice";
import { Icon } from "@/components/brand";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

/** "Siapa yang masuk?" → 4-digit keypad. A wrong PIN clears the dots and shakes them. */
export function PinLogin({ people, next }: { people: PinPerson[]; next: string }) {
  const [pick, setPick] = useState<PinPerson | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [pending, start] = useTransition();

  const press = (k: string) => {
    if (pending || !pick) return;
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!k || pin.length >= 4) return;
    setError(null);
    const value = pin + k;
    setPin(value);
    if (value.length === 4) {
      start(async () => {
        const res = await pinLogin(pick.id, value, next);
        // Success redirects; only failures come back.
        if (res?.error) {
          setPin("");
          setError(res.error);
          setShake((n) => n + 1);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(120);
        }
      });
    }
  };

  useEffect(() => {
    if (!pick) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
      else if (e.key === "Escape") setPick(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!pick) {
    return (
      <>
        <h1 className="font-display text-[22px] font-bold">Siapa yang masuk?</h1>
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPick(p);
              setPin("");
              setError(null);
            }}
            className="flex min-h-16 items-center gap-3.5 rounded-md border-[1.5px] border-brand-espresso/18 bg-white px-4 text-left hover:border-brand-espresso/40"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-butter font-display text-[17px] font-bold text-brand-wine">
              {p.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[17px]">{p.name}</b>
              {p.title && <span className="block text-[13px] text-brand-muted">{p.title}</span>}
            </span>
            <Icon name="chevron_right" size={22} className="text-brand-muted" />
          </button>
        ))}
      </>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setPick(null)} className="flex min-h-10 items-center gap-1.5 self-start text-sm font-bold text-brand-muted">
        <Icon name="arrow_back" size={20} /> Ganti orang
      </button>
      <h1 className="font-display text-[22px] font-bold">Halo, {pick.name}. Masukkan PIN</h1>
      <div key={shake} className={`flex justify-center gap-4 py-1.5 ${shake ? "animate-pin-shake" : ""}`} aria-label={`${pin.length} dari 4 angka`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-4 rounded-full border-2 ${
              error ? "border-brand-wine" : i < pin.length ? "border-brand-espresso bg-brand-espresso" : "border-brand-espresso/35"
            }`}
          />
        ))}
      </div>
      {error && <p role="alert" className="text-center text-sm font-bold text-brand-wine">{error}</p>}
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              disabled={pending}
              aria-label={k === "del" ? "Hapus" : k}
              className={`flex min-h-[54px] items-center justify-center rounded-md font-display text-[22px] font-bold disabled:opacity-60 ${
                k === "del" ? "" : "border-[1.5px] border-brand-espresso/18 bg-white active:bg-brand-butter"
              }`}
            >
              {k === "del" ? <Icon name="backspace" size={22} /> : k}
            </button>
          ),
        )}
      </div>
      {pending && <p className="text-center text-sm text-brand-muted">Memeriksa…</p>}
    </>
  );
}
