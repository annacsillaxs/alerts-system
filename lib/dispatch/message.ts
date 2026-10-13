import type { Event } from "@prisma/client";
import type { AlertMessage } from "@/lib/channels/types";
import type { MetricType } from "@/lib/metrics/types";
import { parseJson } from "@/lib/validation";

export function buildMessage(event: Event, metric: MetricType): AlertMessage {
  const prefix = event.source === "simulated" ? "[SIMULATED] " : "";
  const value = metric.extract(parseJson(event.metrics));
  const lines = [
    event.title,
    `${metric.label}: ${value ?? "unknown"}${metric.unit ? ` ${metric.unit}` : ""}`,
    `Time (UTC): ${event.occurredAt.toISOString()}`,
  ];
  if (event.sourceUrl) lines.push(`Source: ${event.sourceUrl}`);

  return { subject: `${prefix}${event.title}`, text: lines.join("\n") };
}
