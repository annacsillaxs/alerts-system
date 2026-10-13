"use server";

import { refresh } from "next/cache";
import { retryDelivery } from "@/lib/dispatch/dispatcher";
import { describeError } from "@/lib/errors";
import { injectSimulatedEvent, runIngestion } from "@/lib/ingestion/run";

// Each action returns a short status line for the form that called it.
// No auth: the admin view is open in the demo (DECISIONS #14/#16).

export async function runIngestionAction(): Promise<string> {
  try {
    const s = await runIngestion();
    return `Fetched ${s.fetched}, new ${s.new}, skipped ${s.skipped}, sent ${s.sent}, failed ${s.failed}`;
  } catch (e) {
    return `Ingestion failed: ${describeError(e)}`;
  } finally {
    refresh();
  }
}

export async function injectSimulatedEventAction(_prev: string | null, form: FormData): Promise<string> {
  try {
    const r = await injectSimulatedEvent(form.get("magnitude"));
    return `Injected "${r.title}": sent ${r.sent}, failed ${r.failed}`;
  } catch (e) {
    return `Inject failed: ${describeError(e)}`;
  } finally {
    refresh();
  }
}

export async function retryDeliveryAction(_prev: string | null, form: FormData): Promise<string> {
  try {
    const outcome = await retryDelivery(String(form.get("deliveryId")));
    return outcome === "sent" ? "Retry sent" : "Retry failed again (see error)";
  } catch (e) {
    return `Retry failed: ${describeError(e)}`;
  } finally {
    refresh();
  }
}
