import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { ZodError } from "zod";
import { HttpError, toErrorMessage } from "./errors";
import { healthRoutes } from "./routes/health";
import { wagerRoutes } from "./routes/wagers";

function jsonError(status: number, message: string, issues?: unknown) {
  const payload = issues === undefined
    ? { message }
    : { message, issues };

  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export function createApp() {
  const api = new Elysia({ prefix: "/api" })
    .use(healthRoutes)
    .use(wagerRoutes);

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
          ],
        },
      }),
    )
    .use(api)
    .onError(({ error, set }) => {
      if (error instanceof HttpError) {
        set.status = error.status;
        return jsonError(error.status, error.message);
      }

      if (error instanceof ZodError) {
        set.status = 400;
        return jsonError(400, "Validation failed", error.issues);
      }

      set.status = 500;
      return jsonError(500, toErrorMessage(error));
    });
}

export type App = ReturnType<typeof createApp>;
