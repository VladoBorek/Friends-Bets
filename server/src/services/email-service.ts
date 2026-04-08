import nodemailer, { type Transporter } from "nodemailer";
import { readServerConfig } from "../config";
import { HttpError } from "../errors";

type EmailTemplatePayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SuspensionNotificationTemplate = {
  email: string;
  username: string;
  suspendedUntilIso: string;
};

export type SecurityNotificationTemplate = {
  email: string;
  username: string;
  changedAtIso: string;
};

export type RegistrationTemplate = {
  email: string;
  username: string;
  activationUrl: string;
};

export type GenericNotificationTemplate = {
  email: string;
  username: string;
  title: string;
  message: string;
};

class EmailClient {
  private readonly enabled: boolean;
  private readonly provider: "smtp" | "log";
  private readonly from: string;
  private readonly transporter: Transporter | null;

  constructor() {
    const config = readServerConfig().email;
    this.enabled = config.enabled;
    this.provider = config.provider;
    this.from = config.from;

    if (this.provider === "smtp") {
      if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
        throw new Error("EMAIL_SMTP_HOST, EMAIL_SMTP_USER and EMAIL_SMTP_PASS are required for SMTP provider.");
      }

      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    } else {
      this.transporter = null;
    }
  }

  async verify(): Promise<void> {
    if (!this.enabled) return;
    if (this.provider === "smtp" && this.transporter) {
      await this.transporter.verify();
    }
  }

  async send(template: EmailTemplatePayload): Promise<void> {
    if (!this.enabled) return;

    if (this.provider === "log") {
      console.log("[Email LOG]", {
        from: this.from,
        to: template.to,
        subject: template.subject,
        text: template.text ?? null,
        html: template.html,
      });
      return;
    }

    if (!this.transporter) {
      throw new HttpError(500, "Email transporter is not initialized");
    }

    await this.transporter.sendMail({
      from: this.from,
      to: template.to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }

  async sendRegistrationEmail(input: RegistrationTemplate): Promise<void> {
    await this.send({
      to: input.email,
      subject: "Welcome to PB138 - activate your account",
      text: `Hello ${input.username}, activate your account: ${input.activationUrl}`,
      html: `<p>Hello <strong>${input.username}</strong>,</p><p>Welcome to PB138. Activate your account here:</p><p><a href="${input.activationUrl}">${input.activationUrl}</a></p>`,
    });
  }

  async sendPasswordChangedEmail(input: SecurityNotificationTemplate): Promise<void> {
    await this.send({
      to: input.email,
      subject: "PB138 security notification - password changed",
      text: `Hello ${input.username}, your password was changed at ${input.changedAtIso}.`,
      html: `<p>Hello <strong>${input.username}</strong>,</p><p>Your password was changed at <strong>${input.changedAtIso}</strong>.</p><p>If this was not you, contact support immediately.</p>`,
    });
  }

  async sendSuspensionEmail(input: SuspensionNotificationTemplate): Promise<void> {
    await this.send({
      to: input.email,
      subject: "PB138 account suspension notice",
      text: `Hello ${input.username}, your account is suspended from placing bets until ${input.suspendedUntilIso}.`,
      html: `<p>Hello <strong>${input.username}</strong>,</p><p>Your account has been suspended from placing bets until <strong>${input.suspendedUntilIso}</strong>.</p>`,
    });
  }

  async sendGenericNotification(input: GenericNotificationTemplate): Promise<void> {
    await this.send({
      to: input.email,
      subject: `PB138 notification - ${input.title}`,
      text: `Hello ${input.username}, ${input.message}`,
      html: `<p>Hello <strong>${input.username}</strong>,</p><p>${input.message}</p>`,
    });
  }
}

export const emailClient = new EmailClient();
