"use server";

import { refresh } from "next/cache";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";
import { describeError } from "@/lib/errors";
import { createRule, deleteRule } from "@/lib/rules";

const CONFIG_PREFIX = "config.";

export async function switchUserAction(userId: string): Promise<void> {
  await setCurrentUser(userId);
  refresh();
}

export async function createRuleAction(_prev: string | null, form: FormData): Promise<string> {
  try {
    const user = await getCurrentUser();
    if (!user) return "No user selected";

    // Channel fields arrive as "config.<name>"; the adapter decides what's valid.
    const rawConfig: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      if (key.startsWith(CONFIG_PREFIX)) rawConfig[key.slice(CONFIG_PREFIX.length)] = value;
    }

    const result = await createRule({
      userId: user.id,
      categoryId: String(form.get("categoryId")),
      threshold: form.get("threshold"),
      channelType: String(form.get("channelType")),
      rawConfig,
    });
    return result.ok ? "Rule created" : `Not saved: ${result.errors.join("; ")}`;
  } catch (e) {
    return `Not saved: ${describeError(e)}`;
  } finally {
    refresh();
  }
}

export async function deleteRuleAction(_prev: string | null, form: FormData): Promise<string> {
  try {
    const user = await getCurrentUser();
    if (!user) return "No user selected";
    return (await deleteRule(user.id, String(form.get("ruleId")))) ? "Deleted" : "Rule not found";
  } catch (e) {
    return `Delete failed: ${describeError(e)}`;
  } finally {
    refresh();
  }
}
