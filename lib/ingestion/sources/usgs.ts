import type { NormalisedEvent } from "../types";

// "All earthquakes, past day" summary feed (GeoJSON).
const FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

export const USGS_SOURCE = "usgs";

/** Fetches the feed and returns its raw features. Throws on network/HTTP/parse errors. */
export async function fetchUsgsFeatures(): Promise<unknown[]> {
  const res = await fetch(FEED_URL, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`USGS feed returned HTTP ${res.status}`);
  const body: unknown = await res.json();
  const features = (body as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) throw new Error("USGS feed has no features array");
  return features;
}

/**
 * Maps one GeoJSON feature to an event. Returns null for non-earthquakes
 * (the feed also has e.g. "explosion", "quarry blast") or missing required fields.
 * Field names checked against the live feed: top-level `id`, properties
 * `type`, `mag` (number), `time` (epoch ms), `title`, `url`.
 */
export function normaliseUsgsFeature(feature: unknown): NormalisedEvent | null {
  if (typeof feature !== "object" || feature === null) return null;
  const { id, properties } = feature as { id?: unknown; properties?: unknown };
  if (typeof properties !== "object" || properties === null) return null;
  const { type, mag, time, title, url } = properties as Record<string, unknown>;

  if (type !== "earthquake") return null;
  if (typeof id !== "string" || typeof time !== "number" || typeof title !== "string") return null;

  return {
    source: USGS_SOURCE,
    externalId: id,
    title,
    occurredAt: new Date(time),
    sourceUrl: typeof url === "string" ? url : null,
    metrics: { magnitude: typeof mag === "number" ? mag : null },
  };
}
