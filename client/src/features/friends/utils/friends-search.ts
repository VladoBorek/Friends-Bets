import { z } from "zod";

export const FRIENDS_PAGE_SIZE = 5;

export const friendsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type FriendsSearch = z.infer<typeof friendsSearchSchema>;
