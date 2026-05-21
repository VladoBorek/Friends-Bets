import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import {
  getWalletResponseSchema,
  paginatedWalletTransactionsResponseSchema,
  walletBalanceMutationRequestSchema,
  walletBalanceMutationResponseSchema,
  walletTransactionsQuerySchema,
} from "@pb138/shared/schemas/wallet";
import { HttpError } from "../errors";
import { getUserById } from "../services/user";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "../services/wagers";
import {
  depositToWallet,
  getWalletOverview,
  getWalletTransactionsPaginated,
  withdrawFromWallet,
} from "../services/wallet";

import type { WideEventBuilder } from "../observability";

function getWideEvent(context: unknown): WideEventBuilder | undefined {
  if (context && typeof context === "object" && "wideEvent" in context) {
    return context.wideEvent as WideEventBuilder;
  }

  return undefined;
}

export const walletRoutes = new Elysia({ prefix: "/wallet" })
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
        throw new HttpError({
          status: 401,
          code: "AUTH_REQUIRED",
          message: "Authentication is required",
        });
      }

      const profile = await jwt.verify(auth_session.value as string);

      if (
        !profile ||
        typeof profile !== "object" ||
        !("id" in profile) ||
        typeof profile.id !== "number"
      ) {
        throw new HttpError({
          status: 401,
          code: "AUTH_INVALID_SESSION",
          message: "Authentication session is invalid",
        });
      }

      const user = await getUserById(profile.id);
      getWideEvent(context)?.setUserId(user.id);

      return user;
    },
  }))
  .get("/me", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    const data = await getWalletOverview(user.id);

    return getWalletResponseSchema.parse({ data });
  })
  .get("/transactions", async ({ query, getCurrentUser }) => {
    const user = await getCurrentUser();
    const parsedQuery = walletTransactionsQuerySchema.parse(query);
    const result = await getWalletTransactionsPaginated(user.id, parsedQuery);

    return paginatedWalletTransactionsResponseSchema.parse(result);
  })
  .post("/deposit", async ({ body, getCurrentUser }) => {
    const user = await getCurrentUser();
    ensureUserIsVerified(user);
    ensureUserIsNotSuspended(user);

    const parsedBody = walletBalanceMutationRequestSchema.parse(body);
    const data = await depositToWallet(user.id, parsedBody.amount);

    return walletBalanceMutationResponseSchema.parse({ data });
  })
  .post("/withdraw", async ({ body, getCurrentUser }) => {
    const user = await getCurrentUser();
    ensureUserIsVerified(user);
    ensureUserIsNotSuspended(user);

    const parsedBody = walletBalanceMutationRequestSchema.parse(body);
    const data = await withdrawFromWallet(user.id, parsedBody.amount);

    return walletBalanceMutationResponseSchema.parse({ data });
  });