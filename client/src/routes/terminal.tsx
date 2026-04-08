import { createFileRoute, redirect } from "@tanstack/react-router";
import { TerminalPage } from "../pages/terminal";

export const Route = createFileRoute("/terminal")({
  beforeLoad: async ({ context }) => {
    if (context.auth.isLoading) {
      await context.auth.refreshUser();
    }

    if (context.auth.user?.roleName !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: TerminalPage,
});
