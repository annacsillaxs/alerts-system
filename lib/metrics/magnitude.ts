import type { MetricType } from "./types";

export const magnitude: MetricType = {
  key: "magnitude",
  label: "Magnitude",

  extract(metrics) {
    if (typeof metrics !== "object" || metrics === null) return null;
    const value = (metrics as Record<string, unknown>).magnitude;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  },

  validateThreshold(raw) {
    const value = typeof raw === "string" ? Number(raw) : raw;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, errors: ["Threshold must be a number"] };
    }
    if (value < -2 || value > 10) {
      return { ok: false, errors: ["Magnitude threshold must be between -2 and 10"] };
    }
    return { ok: true, config: value };
  },
};
