import { magnitude } from "./magnitude";
import type { MetricType } from "./types";

const metrics = new Map<string, MetricType>([magnitude].map((m) => [m.key, m]));

export function getMetric(key: string): MetricType | undefined {
  return metrics.get(key);
}

/** A rule matches when the value exists and value ≥ threshold. */
export function meetsThreshold(value: number | null, threshold: number): boolean {
  return value !== null && value >= threshold;
}
