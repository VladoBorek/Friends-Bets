import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { NotFoundError } from "elysia/error";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { healthRoutes } from "./routes/health";
import { wagerRoutes } from "./routes/wagers";
import { userRoutes } from "./routes/user";
import { emailRoutes } from "./routes/email";
import { walletRoutes } from "./routes/wallet";
import { friendRoutes } from "./routes/friends";
import { groupRoutes } from "./routes/groups";

function getRequestId(headers: Record<string, string | undefined>) {
  const incomingRequestId = headers["x-request-id"]?.trim();
  return incomingRequestId || randomUUID();
}

export function createApp() {
  const api = new Elysia({ prefix: "/api" })
    .use(healthRoutes)
    .use(wagerRoutes)
    .use(userRoutes)
    .use(emailRoutes)
    .use(walletRoutes)
    .use(friendRoutes)
    .use(groupRoutes);

  return new Elysia({ adapter: node() })
    .use(cors({ origin: true }))
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
    .derive(({ headers, set }) => {
      const requestId = getRequestId(headers);

      set.headers["x-request-id"] = requestId;

      return {
        requestId,
      };
    })
    .onError(({ error, headers, set }) => {
      const requestId = getRequestId(headers);

      set.headers["content-type"] = "application/json; charset=utf-8";
      set.headers["x-request-id"] = requestId;

      if (error instanceof HttpError) {
        set.status = error.status;

        return {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            requestId,
          },
        };
      }

      if (error instanceof NotFoundError) {
        set.status = 404;

        return {
          error: {
            code: "ENDPOINT_NOT_FOUND",
            message: "Endpoint not found",
            requestId,
          },
        };
      }

      if (error instanceof ZodError) {
        set.status = 400;

        return {
          error: {
            code: "VALIDATION_FAILED",
            message: "Validation failed",
            details: error.issues,
            requestId,
          },
        };
      }

      console.error("[API InternalError]", {
        requestId,
        error,
      });

      set.status = 500;

      return {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected server error",
          requestId,
        },
      };
    })
    .use(api);
}

export type App = ReturnType<typeof createApp>;