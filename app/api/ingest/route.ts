import { describeError } from "@/lib/errors";
import { runIngestion } from "@/lib/ingestion/run";

export async function POST() {
  try {
    return Response.json(await runIngestion());
  } catch (e) {
    const error = describeError(e);
    console.error("[ingest] failed:", error);
    return Response.json({ error }, { status: 502 });
  }
}
