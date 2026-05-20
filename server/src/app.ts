import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { NotFoundError } from "elysia/error";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { emailRoutes } from "./routes/email";
import { friendRoutes } from "./routes/friends";
import { groupRoutes } from "./routes/groups";
import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/user";
import { wagerRoutes } from "./routes/wagers";
import { walletRoutes } from "./routes/wallet";

function getRequestId(headers: Record<string, string | undefined>) {
  const incomingRequestId = headers["x-request-id"]?.trim();
  return incomingRequestId || randomUUID();
}

function buildErrorResponse(input: {
  code: string;
  message: string;
  requestId: string;
  details?: unknown;
}) {
  return {
    error: input.details === undefined
      ? {
          code: input.code,
          message: input.message,
          requestId: input.requestId,
        }
      : {
          code: input.code,
          message: input.message,
          details: input.details,
          requestId: input.requestId,
        },
  };
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
    .onError(({ error, headers, set, requestId }) => {
      const resolvedRequestId = requestId ?? getRequestId(headers);

      set.headers["content-type"] = "application/json; charset=utf-8";
      set.headers["x-request-id"] = resolvedRequestId;

      if (error instanceof HttpError) {
        set.status = error.status;

        return buildErrorResponse({
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: resolvedRequestId,
        });
      }

      if (error instanceof NotFoundError) {
        set.status = 404;

        return buildErrorResponse({
          code: "ENDPOINT_NOT_FOUND",
          message: "Endpoint not found",
          requestId: resolvedRequestId,
        });
      }

      if (error instanceof ZodError) {
        set.status = 400;

        return buildErrorResponse({
          code: "VALIDATION_FAILED",
          message: "Validation failed",
          details: error.issues,
          requestId: resolvedRequestId,
        });
      }

      console.error("[API InternalError]", {
        requestId: resolvedRequestId,
        error,
      });

      set.status = 500;

      return buildErrorResponse({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error",
        requestId: resolvedRequestId,
      });
    })
    .use(api);
}

export type App = ReturnType<typeof createApp>;