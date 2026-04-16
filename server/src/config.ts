import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  EMAIL_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_PROVIDER: z.enum(["smtp", "log"]).optional(),
  EMAIL_SMTP_HOST: z.string().optional(),
  EMAIL_SMTP_PORT: z.coerce.number().int().positive().optional(),
  EMAIL_SMTP_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  EMAIL_SMTP_USER: z.string().optional(),
  EMAIL_SMTP_PASS: z.string().optional(),
});

export function readServerConfig() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`);
  }

  return {
    port: parsed.data.PORT,
    email: {
      enabled: parsed.data.EMAIL_ENABLED ?? false,
      from: parsed.data.EMAIL_FROM ?? "no-reply@pb138.local",
      provider: parsed.data.EMAIL_PROVIDER ?? "log",
      smtp: {
        host: parsed.data.EMAIL_SMTP_HOST,
        port: parsed.data.EMAIL_SMTP_PORT ?? 587,
        secure: parsed.data.EMAIL_SMTP_SECURE ?? false,
        user: parsed.data.EMAIL_SMTP_USER,
        pass: parsed.data.EMAIL_SMTP_PASS,
      },
    },
  };
}
