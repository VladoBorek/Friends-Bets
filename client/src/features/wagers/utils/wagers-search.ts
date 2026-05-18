import { z } from "zod";

export const WAGERS_PAGE_SIZE = 10;

export const wagersSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type WagersSearch = z.infer<typeof wagersSearchSchema>;
