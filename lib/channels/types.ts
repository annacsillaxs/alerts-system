import type { ConfigResult } from "@/lib/validation";

export interface AlertMessage {
  subject: string;
  text: string; // plain text, same for every channel
}

export type SendResult = { ok: true } | { ok: false; error: string };

export interface ChannelAdapter<TConfig> {
  readonly type: string;
  readonly label: string;
  /** Used when a rule is created and again before each send. */
  validateConfig(raw: unknown): ConfigResult<TConfig>;
  send(message: AlertMessage, config: TConfig): Promise<SendResult>;
  /** Human-readable config for admin tables; masks secrets. */
  describeConfig(config: TConfig): string;
}
