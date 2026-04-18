// client/src/features/friends/friends-search.ts
import { z } from "zod";

export const FRIENDS_PAGE_SIZE = 5;

export const friendsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  friendId: z.coerce.number().int().positive().optional(),
});

export type FriendsSearch = z.infer<typeof friendsSearchSchema>;
