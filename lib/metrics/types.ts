import type { ConfigResult } from "@/lib/validation";

export interface MetricType {
  readonly key: string; // matches Category.metricType, e.g. "magnitude"
  readonly label: string;
  readonly unit?: string;
  /** Reads the value from parsed Event.metrics; null if absent or invalid. */
  extract(metrics: unknown): number | null;
  validateThreshold(raw: unknown): ConfigResult<number>;
}
