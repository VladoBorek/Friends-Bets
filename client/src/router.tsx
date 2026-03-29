import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { WagerDetailPage } from "./pages/wager-detail-page";
import { HomePage } from "./pages/home-page";
import { NewWagerPage } from "./pages/new-wager-page";
import { RootLayout } from "./pages/root-layout";
import { WagersPage } from "./pages/wagers-page";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const wagersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wagers",
  component: WagersPage,
});

const wagerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wagers/$wagerId",
  component: function WagerDetailRouteComponent() {
    const { wagerId } = wagerDetailRoute.useParams();
    return <WagerDetailPage wagerId={Number(wagerId)} />;
  },
});

const newWagerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wagers/new",
  component: NewWagerPage,
});

const routeTree = rootRoute.addChildren([indexRoute, wagersRoute, wagerDetailRoute, newWagerRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
