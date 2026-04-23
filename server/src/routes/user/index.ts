import { Elysia } from "elysia";
import { authPlugin, getAuthenticatedUser } from "../../plugins/auth";
import { authRoutes } from "./auth-routes";
import { adminRoutes } from "./admin-routes";
import { profileRoutes } from "./profile-routes";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin) // Provides JWT to all routes
  .use(authRoutes) // Public routes (login/register/etc)
  .use(
    new Elysia()
      .derive((context) => {
        return {
          getCurrentUser: () => getAuthenticatedUser(context as any)
        };
      })
      .use(adminRoutes)
      .use(profileRoutes)
  );
