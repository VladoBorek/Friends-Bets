import { createRootRouteWithContext, redirect } from "@tanstack/react-router";
import { RootLayout } from "../pages/root-layout";
import type { UserSummary } from "@pb138/shared/schemas/user";

export interface RouterContext {
  auth: {
    user: UserSummary | null;
    isLoading: boolean;
    refreshUser: () => Promise<UserSummary | null>;
    logout: () => Promise<void>;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  beforeLoad: async ({ context, location }) => {
    const publicPaths = new Set(["/login", "/register", "/verify-email", "/reset-password"]);
    const refreshedUser = await context.auth.refreshUser();

    if (!refreshedUser && !publicPaths.has(location.pathname)) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (refreshedUser && (location.pathname === "/login" || location.pathname === "/register")) {
      throw redirect({ to: "/" });
    }

    if (location.pathname === "/terminal" && refreshedUser?.roleName !== "ADMIN") {
      throw redirect({
        to: "/",
      });
    }
  },
});
