import type { ConfigResult } from "@/lib/validation";

export interface AlertMessage {
  subject: string;
  text: string; // plain text, same for every channel
}

export type SendResult = { ok: true } | { ok: false; error: string };

/** One input the rule form renders for this channel; its value lands in config[name]. */
export interface ConfigField {
  name: string;
  label: string;
  inputType: "email" | "url" | "text";
  placeholder?: string;
}

export interface ChannelAdapter<TConfig> {
  readonly type: string;
  readonly label: string;
  readonly configFields: ConfigField[];
  /** Used when a rule is created and again before each send. */
  validateConfig(raw: unknown): ConfigResult<TConfig>;
  send(message: AlertMessage, config: TConfig): Promise<SendResult>;
  /** Human-readable config for admin tables; masks secrets. */
  describeConfig(config: TConfig): string;
}
