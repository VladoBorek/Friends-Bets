import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { readServerConfig } from "./config";
import { handleAppError } from "./http/error-handler";
import { requestContextPlugin } from "./observability";
import { emailRoutes } from "./routes/email";
import { friendRoutes } from "./routes/friends";
import { groupAdminRoutes } from "./routes/groups-admin";
import { groupRoutes } from "./routes/groups";
import { healthRoutes } from "./routes/health";
import { notificationRoutes } from "./routes/notifications";
import { userRoutes } from "./routes/user";
import { wagerRoutes } from "./routes/wagers";
import { walletRoutes } from "./routes/wallet";

export function createApp() {
  const config = readServerConfig();
  const api = new Elysia({ prefix: "/api" })
    .use(healthRoutes)
    .use(wagerRoutes)
    .use(userRoutes)
    .use(emailRoutes)
    .use(walletRoutes)
    .use(friendRoutes)
    .use(groupRoutes)
    .use(groupAdminRoutes)
    .use(notificationRoutes);

  return new Elysia({ adapter: node() })
    .use(cors({ origin: config.corsOrigins }))
    .use(
      swagger({
        documentation: {
          info: {
            title: "PB138 REST API",
            version: "1.0.0",
            description: "REST API for wagers and outcomes.",
          },
          tags: [
            { name: "Health", description: "Service health endpoints" },
            { name: "Wagers", description: "Wager management endpoints" },
            { name: "Wallet", description: "Wallet and balance endpoints" },
            { name: "Friends", description: "Friendship and friend request endpoints" },
            { name: "Groups", description: "Group membership and group management endpoints" },
          ],
        },
      }),
    )
    .use(requestContextPlugin)
    .onError(handleAppError)
    .use(api);
}

export type App = ReturnType<typeof createApp>;
