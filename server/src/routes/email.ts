import { messageDataSchema } from "@pb138/shared/schemas/api";
import { Elysia } from "elysia";
import { z } from "zod";
import { HttpError } from "../errors";
import { logger } from "../observability";
import { emailClient } from "../services/email-service";

const testEmailRequestSchema = z.object({
  to: z.string().email(),
});

export const emailRoutes = new Elysia({ prefix: "/email" }).post("/test", async ({ body }) => {
  const parsedBody = testEmailRequestSchema.parse(body);

  try {
    await emailClient.send({
      to: parsedBody.to,
      subject: "PB138 test email",
      text: "This is a PB138 test email.",
      html: "<p>This is a PB138 test email.</p>",
    });
  } catch (error) {
    logger.error({
      event_name: "test_email_send_failed",
      error,
    });

    throw new HttpError({
      status: 500,
      code: "EMAIL_SEND_FAILED",
      message: "Failed to send test email",
      cause: error,
    });
  }

  return messageDataSchema.parse({
    data: {
      message: "Test email sent",
    },
  });
});