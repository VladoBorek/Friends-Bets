import { Elysia } from "elysia";
import { authPlugin, getAuthenticatedUser, type AuthContextLike } from "../../plugins/auth";
import { authRoutes } from "./auth-routes";
import { adminRoutes } from "./admin-routes";
import { profileRoutes } from "./profile-routes";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)
  .use(authRoutes)
  .use(
    new Elysia()
      .derive((context) => {
        return {
          getCurrentUser: () => getAuthenticatedUser(context as unknown as AuthContextLike),
        };
      })
      .use(adminRoutes)
      .use(profileRoutes),
  );