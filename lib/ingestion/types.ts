export interface NormalisedEvent {
  source: string;
  externalId: string;
  title: string;
  occurredAt: Date;
  sourceUrl: string | null;
  metrics: Record<string, number | null>;
}

export interface IngestionSummary {
  fetched: number;
  new: number;
  skipped: number;
  sent: number;
  failed: number;
}
