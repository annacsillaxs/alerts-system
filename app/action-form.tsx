"use client";

import { useActionState, type ReactNode } from "react";

/** A form bound to a server action that returns a status line. */
export function ActionForm({
  action,
  label,
  children,
}: {
  action: (prev: string | null, form: FormData) => Promise<string>;
  label: string;
  children?: ReactNode;
}) {
  const [message, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      {children}
      <button type="submit" disabled={pending}>
        {pending ? "Working…" : label}
      </button>
      {message && <small>{message}</small>}
    </form>
  );
}
