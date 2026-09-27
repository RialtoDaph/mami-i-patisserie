"use client";

import { useActionState } from "react";
import { signIn, type ActionResult } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBox } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(signIn, {});
  return (
    <form action={formAction} className="card flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label>
        <span className="field-label">Email</span>
        <input name="email" type="email" autoComplete="email" inputMode="email" required className="input" />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      <ErrorBox message={state.error} />
      <SubmitButton>Masuk</SubmitButton>
    </form>
  );
}
