import { Elysia } from "elysia";
import { authPlugin, getAuthenticatedUser } from "../../plugins/auth";
import { authRoutes } from "./auth-routes";
import { adminRoutes } from "./admin-routes";
import { profileRoutes } from "./profile-routes";

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(authPlugin)
  .derive((context) => {
    return {
      getCurrentUser: () => getAuthenticatedUser(context)
    };
  })
  .use(authRoutes)
  .use(adminRoutes)
  .use(profileRoutes);
