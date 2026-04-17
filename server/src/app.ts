import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { NotFoundError } from "elysia/error";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { healthRoutes } from "./routes/health";
import { wagerRoutes } from "./routes/wagers";
import { userRoutes } from "./routes/users";
import { emailRoutes } from "./routes/email";
import { friendRoutes } from "./routes/friends";



export function createApp() {
  const api = new Elysia({ prefix: "/api" })
    .use(healthRoutes)
    .use(wagerRoutes)
    .use(userRoutes)
    .use(emailRoutes)
    .use(friendRoutes);

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
            { name: "Friends", description: "Friendship and friend request endpoints" },

          ],
        },
      }),
    )
    .use(api)
    .onError(({ error, set }) => {
      console.error("[API Error]", { error });
      set.headers = {
        "content-type": "application/json; charset=utf-8",
      };

      if (error instanceof HttpError) {
        set.status = error.status;
        console.error("[API HttpError]", error.status, error.message);
        return { message: error.message };
      }

      if (error instanceof NotFoundError) {
        set.status = 404;
        return { message: "Endpoint not found" };
      }

      if (error instanceof ZodError) {
        set.status = 400;
        console.error("[API ZodError]", error.issues);
        return {
          message: "Validation failed",
          issues: error.issues,
        };
      }

      set.status = 500;
      console.error("[API InternalError]", error);
      return {
        message: "Unexpected server error",
      };
    });
}

export type App = ReturnType<typeof createApp>;
