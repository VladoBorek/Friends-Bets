import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { z } from "zod";
import { listNotificationsResponseSchema, markReadResponseSchema } from "@pb138/shared/schemas/notifications";
import { HttpError } from "../errors";
import { getUserById } from "../services/user";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notifications/notification-service";

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    }),
  )
  .derive(async (context) => ({
    getCurrentUser: async () => {
      const { jwt, cookie: { auth_session } } = context;

      if (!auth_session?.value) {
        throw new HttpError({ status: 401, code: "AUTH_REQUIRED", message: "Authentication is required" });
      }

      const profile = await jwt.verify(auth_session.value as string);

      if (!profile || typeof profile !== "object" || !("id" in profile) || typeof profile.id !== "number") {
        throw new HttpError({ status: 401, code: "AUTH_INVALID_SESSION", message: "Authentication session is invalid" });
      }

      return getUserById(profile.id);
    },
  }))
  .get("", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    const notifications = await listNotificationsForUser(user.id);

    return listNotificationsResponseSchema.parse({
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        data: n.data,
        isRead: n.isRead,
        sourceKey: n.sourceKey,
        createdAt: n.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    });
  })
  .patch("/read-all", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    await markAllNotificationsRead(user.id);
    return markReadResponseSchema.parse({ data: { success: true } });
  })
  .patch("/:id/read", async ({ params, getCurrentUser }) => {
    const { id } = idParamsSchema.parse(params);
    const user = await getCurrentUser();
    await markNotificationRead(id, user.id);
    return markReadResponseSchema.parse({ data: { success: true } });
  });
