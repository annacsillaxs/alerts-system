"use client";

import { startTransition } from "react";
import { switchUserAction } from "./actions";

export function UserSwitcher({
  users,
  currentId,
}: {
  users: { id: string; name: string; role: string }[];
  currentId: string;
}) {
  // Called directly (not via <form action>) so React's form reset can't put the
  // select back to its initial value; key re-mounts it when the user changes.
  return (
    <label>
      Acting as{" "}
      <select
        key={currentId}
        defaultValue={currentId}
        onChange={(e) => {
          const userId = e.target.value;
          startTransition(() => switchUserAction(userId));
        }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
            {u.role === "admin" ? " (admin)" : ""}
          </option>
        ))}
      </select>{" "}
      <small>(no auth: demo user switcher)</small>
    </label>
  );
}
