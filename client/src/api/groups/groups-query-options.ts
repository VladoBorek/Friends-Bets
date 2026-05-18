import { queryOptions } from "@tanstack/react-query";
import { GROUP_MEMBERS_PAGE_SIZE, GROUPS_PAGE_SIZE } from "../../features/groups/utils/groups-search";
import { fetchGroups } from "./groups-api";
import { fetchGroupMembers } from "./group-members-api";

export const groupsKeys = {
  all: ["groups"] as const,
  list: (page: number, query = "") => ["groups", "list", page, query] as const,
  members: (groupId: number, page: number, query = "") =>
    ["groups", "members", groupId, page, query] as const,
};

export const groupsQueries = {
  list: (page: number, query = "") =>
    queryOptions({
      queryKey: groupsKeys.list(page, query),
      queryFn: () => fetchGroups({ page, query, limit: GROUPS_PAGE_SIZE }),
      staleTime: 30_000,
    }),

  members: (groupId: number, page: number, query = "") =>
    queryOptions({
      queryKey: groupsKeys.members(groupId, page, query),
      queryFn: () =>
        fetchGroupMembers({
          groupId,
          page,
          query,
          limit: GROUP_MEMBERS_PAGE_SIZE,
        }),
      staleTime: 30_000,
    }),
};