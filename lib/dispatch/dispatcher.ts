import { Prisma, type Delivery, type Event, type Rule } from "@prisma/client";
import { getChannel } from "@/lib/channels/registry";
import { db } from "@/lib/db";
import { describeError } from "@/lib/errors";
import type { MetricType } from "@/lib/metrics/types";
import { parseJson } from "@/lib/validation";
import { buildMessage } from "./message";

type SendOutcome = "sent" | "failed";

/**
 * Creates the Delivery for (event, rule) and sends it inline.
 * Returns null if a Delivery for this pair already exists.
 */
export async function createAndSend(
  event: Event,
  rule: Rule,
  metric: MetricType,
): Promise<SendOutcome | null> {
  let delivery: Delivery;
  try {
    delivery = await db.delivery.create({ data: { eventId: event.id, ruleId: rule.id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null;
    throw e;
  }
  return send(delivery, event, rule, metric);
}

/** Sends one delivery and records the result. Also used for manual retry. */
export async function send(
  delivery: Delivery,
  event: Event,
  rule: Rule,
  metric: MetricType,
): Promise<SendOutcome> {
  const error = await trySend(event, rule, metric);
  const failed = error !== null;
  await db.delivery.update({
    where: { id: delivery.id },
    data: {
      status: failed ? "failed" : "sent",
      attempts: { increment: 1 },
      lastError: error,
      sentAt: failed ? null : new Date(),
    },
  });
  if (failed) console.warn(`[dispatch] delivery ${delivery.id} failed: ${error}`);
  return failed ? "failed" : "sent";
}

/** Returns an error message, or null on success. Never throws. */
async function trySend(event: Event, rule: Rule, metric: MetricType): Promise<string | null> {
  const adapter = getChannel(rule.channelType);
  if (!adapter) return `Unknown channel type: ${rule.channelType}`;

  const config = adapter.validateConfig(parseJson(rule.channelConfig));
  if (!config.ok) return `Invalid channel config: ${config.errors.join("; ")}`;

  try {
    const result = await adapter.send(buildMessage(event, metric), config.config);
    return result.ok ? null : result.error;
  } catch (e) {
    return describeError(e);
  }
}
