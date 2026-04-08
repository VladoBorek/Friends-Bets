import { Elysia } from "elysia";

export const healthRoutes = new Elysia({ prefix: "/health" }).get("", () => {
  return {
    status: "ok",
    service: "pb138-api",
  };
});
