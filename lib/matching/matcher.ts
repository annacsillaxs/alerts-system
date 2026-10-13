import type { Event, Rule } from "@prisma/client";
import { meetsThreshold } from "@/lib/metrics/registry";
import type { MetricType } from "@/lib/metrics/types";
import { parseJson } from "@/lib/validation";

/** Returns the rules (of the event's category) whose threshold the event meets. */
export function matchRules(event: Event, rules: Rule[], metric: MetricType): Rule[] {
  const value = metric.extract(parseJson(event.metrics));
  return rules.filter((rule) => meetsThreshold(value, rule.threshold));
}
