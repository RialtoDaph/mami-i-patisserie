"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions";
import { ErrorBox } from "./ui";

/** Runs a server action (delete, duplicate) after an optional confirm dialog. */
export function ConfirmActionButton({
  action,
  confirmText,
  label,
  pendingLabel,
  className,
}: {
  action: () => Promise<ActionResult>;
  confirmText?: string;
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          setError(null);
          start(async () => {
            const res = await action();
            if (res?.error) setError(res.error);
          });
        }}
      >
        {pending ? pendingLabel : label}
      </button>
      <ErrorBox message={error} />
    </div>
  );
}
