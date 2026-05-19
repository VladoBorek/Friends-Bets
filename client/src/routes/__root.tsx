import { createRootRouteWithContext, redirect } from "@tanstack/react-router";
import { RootRouteComponent } from "../pages/root-layout";
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
  component: RootRouteComponent,
  beforeLoad: async ({ context, location }) => {
    const publicPaths = new Set([
      "/auth/login",
      "/auth/register",
      "/auth/verify-email",
      "/auth/reset-password",
    ]);
    const isPublic = publicPaths.has(location.pathname);
    
    let user = context.auth.user;
    if (!user && !isPublic) {
        user = await context.auth.refreshUser();
    } else if (isPublic) {
        user = await context.auth.refreshUser();
    }

    if (!user && !isPublic) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (user && (location.pathname === "/auth/login" || location.pathname === "/auth/register")) {
      throw redirect({ to: "/" });
    }

    if (location.pathname === "/terminal" && user?.roleName !== "ADMIN") {
      throw redirect({
        to: "/",
      });
    }
  },
});
