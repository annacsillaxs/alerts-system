import { parseJson } from "@/lib/validation";
import { emailAdapter } from "./email";
import { slackMockAdapter } from "./slack-mock";
import type { ChannelAdapter } from "./types";

// Adding a channel = write an adapter and list it here.
const adapters: ChannelAdapter<unknown>[] = [
  emailAdapter as ChannelAdapter<unknown>,
  slackMockAdapter as ChannelAdapter<unknown>,
];

const byType = new Map(adapters.map((a) => [a.type, a]));

export function getChannel(type: string): ChannelAdapter<unknown> | undefined {
  return byType.get(type);
}

export function listChannels(): ChannelAdapter<unknown>[] {
  return adapters;
}

/** Display text for a rule's destination, masked by the channel's adapter. */
export function describeChannelConfig(type: string, rawConfig: string): string {
  const adapter = getChannel(type);
  if (!adapter) return `(unknown channel '${type}')`;
  const config = adapter.validateConfig(parseJson(rawConfig));
  return config.ok ? adapter.describeConfig(config.config) : "(invalid config)";
}
