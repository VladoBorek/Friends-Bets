// client/src/features/friends/api/friends-query-options.ts
import { queryOptions } from "@tanstack/react-query";
import { FRIENDS_PAGE_SIZE } from "../features/friends/friends-search";
import { fetchFriends } from "./friends-api";

export const friendsKeys = {
  all: ["friends"] as const,
  list: (page: number) => ["friends", "list", page] as const,
};

export const friendsQueries = {
  list: (page: number) =>
    queryOptions({
      queryKey: friendsKeys.list(page),
      queryFn: () =>
        fetchFriends({
          page,
          limit: FRIENDS_PAGE_SIZE,
        }),
      staleTime: 30_000,
    }),
};

