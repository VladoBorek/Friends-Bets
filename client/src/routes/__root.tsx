import { createRootRouteWithContext, Outlet, redirect, useLocation } from "@tanstack/react-router";
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
  component: () => {
    const location = useLocation();
    const publicPaths = new Set(["/login", "/register", "/verify-email", "/reset-password"]);
    const isPublic = publicPaths.has(location.pathname);

    if (isPublic) {
      return <Outlet />;
    }

    return <RootLayout />;
  },
  beforeLoad: async ({ context, location }) => {
    const publicPaths = new Set(["/login", "/register", "/verify-email", "/reset-password"]);
    const isPublic = publicPaths.has(location.pathname);
    
    let user = context.auth.user;
    if (!user && !isPublic) {
        user = await context.auth.refreshUser();
    } else if (isPublic) {
        user = await context.auth.refreshUser();
    }

    if (!user && !isPublic) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (user && (location.pathname === "/login" || location.pathname === "/register")) {
      throw redirect({ to: "/" });
    }

    if (location.pathname === "/terminal" && user?.roleName !== "ADMIN") {
      throw redirect({
        to: "/",
      });
    }
  },
});
