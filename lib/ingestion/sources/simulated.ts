import { randomUUID } from "node:crypto";
import type { NormalisedEvent } from "../types";

export const SIMULATED_SOURCE = "simulated";

/** Builds a simulated earthquake. Messages get a [SIMULATED] prefix from the source. */
export function buildSimulatedEarthquake(magnitude: number): NormalisedEvent {
  return {
    source: SIMULATED_SOURCE,
    externalId: randomUUID(),
    title: `M ${magnitude.toFixed(1)} - Simulated earthquake`,
    occurredAt: new Date(),
    sourceUrl: null,
    metrics: { magnitude },
  };
}
