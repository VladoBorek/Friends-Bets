import { z } from "zod";

export const GROUPS_PAGE_SIZE = 6;
export const GROUP_MEMBERS_PAGE_SIZE = 8;

export const groupsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1)
});

export type GroupsSearch = z.infer<typeof groupsSearchSchema>;