import { Elysia } from "elysia";
import { z } from "zod";
import { emailClient } from "../services/email-service";
import { HttpError } from "../errors";

const testEmailSchema = z.object({
  to: z.string().email(),
});

export const emailRoutes = new Elysia({ prefix: "/email" }).post("/test", async ({ body }) => {
  const parsedBody = testEmailSchema.parse(body);
  try {
    await emailClient.sendGenericNotification({
      email: parsedBody.to,
      username: "PB138 User",
      title: "Email client is ready",
      message: "This is a test message from the PB138 email client.",
    });
  } catch (error) {
    throw new HttpError(500, `Failed to send test email: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  return { message: "Test email sent" };
});
