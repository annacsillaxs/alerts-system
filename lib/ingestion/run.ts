import { Prisma, type Category, type Event, type Rule } from "@prisma/client";
import { db } from "@/lib/db";
import { createAndSend } from "@/lib/dispatch/dispatcher";
import { matchRules } from "@/lib/matching/matcher";
import { getMetric } from "@/lib/metrics/registry";
import type { MetricType } from "@/lib/metrics/types";
import { buildSimulatedEarthquake } from "./sources/simulated";
import { fetchUsgsFeatures, normaliseUsgsFeature, USGS_SOURCE } from "./sources/usgs";
import type { IngestionSummary, NormalisedEvent } from "./types";

const EARTHQUAKE_CATEGORY = "earthquake";

/** Runs the USGS pipeline end to end: fetch → dedup → match → dispatch. */
export async function runIngestion(): Promise<IngestionSummary> {
  const { category, metric, rules } = await loadCategory(EARTHQUAKE_CATEGORY);

  const features = await fetchUsgsFeatures();
  const normalised = features
    .map(normaliseUsgsFeature)
    .filter((e): e is NormalisedEvent => e !== null);

  const summary: IngestionSummary = { fetched: features.length, new: 0, skipped: 0, sent: 0, failed: 0 };
  summary.skipped = features.length - normalised.length; // non-earthquakes or missing fields

  const existing = await db.event.findMany({
    where: { source: USGS_SOURCE, externalId: { in: normalised.map((e) => e.externalId) } },
    select: { externalId: true },
  });
  const existingIds = new Set(existing.map((e) => e.externalId));

  for (const item of normalised) {
    if (existingIds.has(item.externalId)) {
      summary.skipped++;
      continue;
    }
    const event = await insertEvent(item, category.id);
    if (!event) {
      summary.skipped++; // inserted concurrently by another run
      continue;
    }
    summary.new++;
    await dispatchMatches(event, rules, metric, summary);
  }

  console.log("[ingest] usgs", summary);
  return summary;
}

export interface InjectResult {
  title: string;
  sent: number;
  failed: number;
}

/** Inserts a simulated earthquake and runs it through the same match → dispatch steps. */
export async function injectSimulatedEvent(rawMagnitude: unknown): Promise<InjectResult> {
  const { category, metric, rules } = await loadCategory(EARTHQUAKE_CATEGORY);
  // A simulated magnitude has the same valid range as a magnitude threshold.
  const magnitude = metric.validateThreshold(rawMagnitude);
  if (!magnitude.ok) throw new Error(magnitude.errors.join("; "));

  const event = await insertEvent(buildSimulatedEarthquake(magnitude.config), category.id);
  if (!event) throw new Error("Simulated event collided with an existing one; try again");

  const result: InjectResult = { title: event.title, sent: 0, failed: 0 };
  await dispatchMatches(event, rules, metric, result);
  console.log("[ingest] simulated", result);
  return result;
}

async function loadCategory(key: string): Promise<{ category: Category; metric: MetricType; rules: Rule[] }> {
  const category = await db.category.findUnique({ where: { key } });
  if (!category) throw new Error(`Category '${key}' not found (run the seed)`);
  const metric = getMetric(category.metricType);
  if (!metric) throw new Error(`Unknown metric type '${category.metricType}'`);
  const rules = await db.rule.findMany({ where: { categoryId: category.id } });
  return { category, metric, rules };
}

async function dispatchMatches(
  event: Event,
  rules: Rule[],
  metric: MetricType,
  counts: { sent: number; failed: number },
): Promise<void> {
  for (const rule of matchRules(event, rules, metric)) {
    const outcome = await createAndSend(event, rule, metric);
    if (outcome) counts[outcome]++;
  }
}

async function insertEvent(item: NormalisedEvent, categoryId: string): Promise<Event | null> {
  try {
    return await db.event.create({
      data: { ...item, categoryId, metrics: JSON.stringify(item.metrics) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null;
    throw e;
  }
}
