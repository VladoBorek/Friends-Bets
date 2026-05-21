import { createFileRoute, redirect } from "@tanstack/react-router";
import { TerminalPage } from "../pages/terminal";
import { z } from "zod";

const terminalSearchSchema = z.object({
  tab: z.enum(["users", "groups", "categories"]).optional(),
  page: z.number().optional(),
  groupId: z.number().optional(),
  view: z.enum(["overview", "members"]).optional(),
});

export type TerminalSearch = z.infer<typeof terminalSearchSchema>;

export const Route = createFileRoute("/terminal")({
  beforeLoad: async ({ context, search }) => {
    const user = await context.auth.refreshUser();

    if (user?.roleName !== "ADMIN") {
      throw redirect({ to: "/" });
    }

    if (!search.tab) {
      throw redirect({
        to: "/terminal",
        search: { ...search, tab: "users", page: 1 },
        replace: true,
      });
    }
  },
  validateSearch: (search) => terminalSearchSchema.parse(search),
  component: TerminalPage,
});
