"use client";

import { startTransition, useActionState, useState } from "react";
import type { ConfigField } from "@/lib/channels/types";
import { createRuleAction } from "./actions";

export interface ChannelOption {
  type: string;
  label: string;
  configFields: ConfigField[];
}

export function RuleForm({
  channels,
  categories,
}: {
  channels: ChannelOption[];
  categories: { id: string; name: string; metricLabel: string }[];
}) {
  const [message, formAction, pending] = useActionState(createRuleAction, null);
  const [channelType, setChannelType] = useState(channels[0]?.type ?? "");
  const channel = channels.find((c) => c.type === channelType);

  return (
    // Submit via onSubmit rather than action={…}: React's automatic form reset would put the
    // channel <select> back to its first option while `channelType` state still shows the old one.
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      style={{ display: "grid", gap: 8, maxWidth: 420 }}
    >
      <label>
        Category{" "}
        <select name="categoryId">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.metricLabel})
            </option>
          ))}
        </select>
      </label>
      <label>
        Notify when ≥{" "}
        <input name="threshold" type="number" step="0.1" required defaultValue="4.5" />
      </label>
      <label>
        Channel{" "}
        <select name="channelType" value={channelType} onChange={(e) => setChannelType(e.target.value)}>
          {channels.map((c) => (
            <option key={c.type} value={c.type}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {channel?.configFields.map((f) => (
        <label key={`${channel.type}.${f.name}`}>
          {f.label}{" "}
          <input name={`config.${f.name}`} type={f.inputType} placeholder={f.placeholder} required />
        </label>
      ))}
      <div>
        <button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create rule"}
        </button>{" "}
        {message && <small>{message}</small>}
      </div>
    </form>
  );
}
