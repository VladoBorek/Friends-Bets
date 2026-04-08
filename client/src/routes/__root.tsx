import { createRootRouteWithContext, redirect } from "@tanstack/react-router";
import { RootLayout } from "../pages/root-layout";
import type { UserSummary } from "../../../shared/src/schemas/user";

export interface RouterContext {
  auth: {
    user: UserSummary | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    if (context.auth.isLoading) {
      await context.auth.refreshUser();
    }

    if (!context.auth.user && location.pathname !== "/login") {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (context.auth.user && location.pathname === "/login") {
      throw redirect({
        to: "/",
      });
    }

    if (location.pathname === "/terminal" && context.auth.user?.roleName !== "ADMIN") {
      throw redirect({
        to: "/",
      });
    }
  },
});
