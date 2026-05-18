import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "../../pages/auth/register-page";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});
