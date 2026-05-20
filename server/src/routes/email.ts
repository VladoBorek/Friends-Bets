import { Elysia } from "elysia";
import { z } from "zod";
import { messageDataSchema } from "@pb138/shared/schemas/api";
import { HttpError } from "../errors";
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
    throw new HttpError(
      500,
      "INTERNAL_SERVER_ERROR",
      `Failed to send test email: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  return messageDataSchema.parse({
    data: {
      message: "Test email sent",
    },
  });
});