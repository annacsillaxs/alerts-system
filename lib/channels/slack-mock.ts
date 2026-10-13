import type { ChannelAdapter } from "./types";

export interface SlackConfig {
  webhookUrl: string; // shaped like a real incoming webhook so the mock can be swapped out
}

function mask(url: string): string {
  return url.length > 40 ? `${url.slice(0, 34)}…${url.slice(-4)}` : url;
}

export const slackMockAdapter: ChannelAdapter<SlackConfig> = {
  type: "slack",
  label: "Slack (mock)",
  configFields: [
    {
      name: "webhookUrl",
      label: "Slack webhook URL",
      inputType: "url",
      placeholder: "https://hooks.slack.com/services/…",
    },
  ],

  validateConfig(raw) {
    const webhookUrl =
      typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>).webhookUrl : undefined;
    if (typeof webhookUrl !== "string" || !webhookUrl.startsWith("https://")) {
      return { ok: false, errors: ["A 'webhookUrl' starting with https:// is required"] };
    }
    return { ok: true, config: { webhookUrl } };
  },

  // Mock: nothing is posted.
  async send(message, config) {
    console.log(`[slack-mock] would POST to ${mask(config.webhookUrl)}: ${message.subject}`);
    return { ok: true };
  },

  describeConfig(config) {
    return mask(config.webhookUrl);
  },
};
