import { z } from "zod";

export const friendWagersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type FriendWagersSearch = z.infer<typeof friendWagersSearchSchema>;
