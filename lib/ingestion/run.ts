import { Prisma, type Event } from "@prisma/client";
import { db } from "@/lib/db";
import { createAndSend } from "@/lib/dispatch/dispatcher";
import { matchRules } from "@/lib/matching/matcher";
import { getMetric } from "@/lib/metrics/registry";
import { fetchUsgsFeatures, normaliseUsgsFeature, USGS_SOURCE } from "./sources/usgs";
import type { IngestionSummary, NormalisedEvent } from "./types";

const EARTHQUAKE_CATEGORY = "earthquake";

/** Runs the USGS pipeline end to end: fetch → dedup → match → dispatch. */
export async function runIngestion(): Promise<IngestionSummary> {
  const category = await db.category.findUnique({ where: { key: EARTHQUAKE_CATEGORY } });
  if (!category) throw new Error(`Category '${EARTHQUAKE_CATEGORY}' not found (run the seed)`);
  const metric = getMetric(category.metricType);
  if (!metric) throw new Error(`Unknown metric type '${category.metricType}'`);

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
  const rules = await db.rule.findMany({ where: { categoryId: category.id } });

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

    for (const rule of matchRules(event, rules, metric)) {
      const outcome = await createAndSend(event, rule, metric);
      if (outcome) summary[outcome]++;
    }
  }

  console.log("[ingest] usgs", summary);
  return summary;
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
