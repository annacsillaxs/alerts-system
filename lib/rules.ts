import { getChannel } from "@/lib/channels/registry";
import { db } from "@/lib/db";
import { getMetric } from "@/lib/metrics/registry";

export interface NewRuleInput {
  userId: string;
  categoryId: string;
  threshold: unknown;
  channelType: string;
  rawConfig: Record<string, unknown>;
}

export type CreateRuleResult = { ok: true } | { ok: false; errors: string[] };

/** Validates threshold (category's metric) and config (channel's adapter), then saves. */
export async function createRule(input: NewRuleInput): Promise<CreateRuleResult> {
  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) return { ok: false, errors: ["Unknown category"] };
  const metric = getMetric(category.metricType);
  if (!metric) return { ok: false, errors: [`Unknown metric type '${category.metricType}'`] };
  const adapter = getChannel(input.channelType);
  if (!adapter) return { ok: false, errors: [`Unknown channel '${input.channelType}'`] };

  const threshold = metric.validateThreshold(input.threshold);
  const config = adapter.validateConfig(input.rawConfig);
  const errors = [...(threshold.ok ? [] : threshold.errors), ...(config.ok ? [] : config.errors)];
  if (!threshold.ok || !config.ok) return { ok: false, errors };

  await db.rule.create({
    data: {
      userId: input.userId,
      categoryId: category.id,
      threshold: threshold.config,
      channelType: adapter.type,
      channelConfig: JSON.stringify(config.config),
    },
  });
  return { ok: true };
}

/** Deletes one of the user's rules; its deliveries go with it (onDelete: Cascade). */
export async function deleteRule(userId: string, ruleId: string): Promise<boolean> {
  const { count } = await db.rule.deleteMany({ where: { id: ruleId, userId } });
  return count > 0;
}
