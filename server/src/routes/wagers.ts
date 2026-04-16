import { Elysia } from "elysia";
import { z } from "zod";
import {
  createWagerRequestSchema,
  createWagerResponseSchema,
  getWagerResponseSchema,
  listWagersResponseSchema,
  placeBetRequestSchema,
  placeBetResponseSchema,
} from "@pb138/shared/schemas/wager";
import { createWager, getWagerById, listWagers, placeBet } from "../services/wager-service";

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const wagerRoutes = new Elysia({ prefix: "/wagers" })
  .get("", async () => {
    const data = await listWagers();
    return listWagersResponseSchema.parse({ data });
  })
  .get("/:id", async ({ params }) => {
    const parsedParams = idParamsSchema.parse(params);
    const data = await getWagerById(parsedParams.id);
    return getWagerResponseSchema.parse({ data });
  })
  .post("", async ({ body }) => {
    const parsedBody = createWagerRequestSchema.parse(body);
    const data = await createWager(parsedBody);
    return createWagerResponseSchema.parse({ data });
  })
  .post("/:id/bets", async ({ params, body }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedBody = placeBetRequestSchema.parse(body);
    const data = await placeBet(parsedParams.id, parsedBody);
    return placeBetResponseSchema.parse({ data });
  });
