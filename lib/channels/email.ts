import nodemailer, { type Transporter } from "nodemailer";
import { describeError } from "@/lib/errors";
import type { ChannelAdapter } from "./types";

export interface EmailConfig {
  to: string;
}

let transport: Transporter | undefined;

function getTransport(): Transporter {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });
  return transport;
}

export const emailAdapter: ChannelAdapter<EmailConfig> = {
  type: "email",
  label: "Email",
  configFields: [{ name: "to", label: "Email address", inputType: "email", placeholder: "you@example.com" }],

  validateConfig(raw) {
    const to = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>).to : undefined;
    if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+$/.test(to)) {
      return { ok: false, errors: ["A valid 'to' email address is required"] };
    }
    return { ok: true, config: { to } };
  },

  async send(message, config) {
    try {
      await getTransport().sendMail({
        from: process.env.MAIL_FROM ?? "alerts@example.com",
        to: config.to,
        subject: message.subject,
        text: message.text,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: describeError(e) };
    }
  },

  describeConfig(config) {
    return config.to;
  },
};
