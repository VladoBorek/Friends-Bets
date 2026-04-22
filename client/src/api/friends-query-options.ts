import { queryOptions } from "@tanstack/react-query";
import { FRIENDS_PAGE_SIZE } from "../features/friends/friends-search";
import { fetchFriends } from "./friends-api";
import { fetchFriendStats, fetchFriendWagersPage } from "./friend-stats-api";

export const FRIEND_WAGER_HISTORY_PAGE_SIZE = 10;

export const friendsKeys = {
  all: ["friends"] as const,
  list: (page: number) => ["friends", "list", page] as const,
  detail: (friendId: number) => ["friends", "detail", friendId] as const,
  wagerHistory: (friendId: number, page: number) => ["friends", "wagers", friendId, page] as const,
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

  detail: (friendId: number) =>
    queryOptions({
      queryKey: friendsKeys.detail(friendId),
      queryFn: () => fetchFriendStats(friendId),
      staleTime: 30_000,
    }),

  wagerHistory: (friendId: number, page: number) =>
    queryOptions({
      queryKey: friendsKeys.wagerHistory(friendId, page),
      queryFn: () =>
        fetchFriendWagersPage({
          friendId,
          page,
          limit: FRIEND_WAGER_HISTORY_PAGE_SIZE,
        }),
      staleTime: 30_000,
    }),
};
