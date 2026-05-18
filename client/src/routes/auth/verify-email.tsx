import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailPage } from "../../pages/auth/verify-email-page";

const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmailPage,
});
