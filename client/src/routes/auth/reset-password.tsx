import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordPage } from "../../pages/auth/reset-password-page";

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
  email: z.string().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  component: ResetPasswordPage,
});
