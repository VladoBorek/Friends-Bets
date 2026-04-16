import { createFileRoute, redirect } from "@tanstack/react-router";
import { TerminalPage } from "../pages/terminal";

export const Route = createFileRoute("/terminal")({
  beforeLoad: async ({ context }) => {
    const user = await context.auth.refreshUser();

    if (user?.roleName !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: TerminalPage,
});
