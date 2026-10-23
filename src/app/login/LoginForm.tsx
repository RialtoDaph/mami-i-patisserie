"use client";

import { useActionState } from "react";
import { signIn, type ActionResult } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Input } from "@/components/brand";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<ActionResult & { email?: string }, FormData>(signIn, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field tone="app" label="Email">
        <Input tone="app" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.email} key={state.email} />
      </Field>
      <Field tone="app" label="Password">
        <Input tone="app" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && <p role="alert" className="text-sm font-semibold text-brand-wine">{state.error}</p>}
      <SubmitButton className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand-wine text-[15px] font-bold text-brand-butter disabled:opacity-60">
        Masuk
      </SubmitButton>
    </form>
  );
}
