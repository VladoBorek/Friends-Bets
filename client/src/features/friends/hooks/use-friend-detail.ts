import { useQuery } from "@tanstack/react-query";
import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { friendsQueries } from "../../../api/friends/friends-query-options";

export function useFriendDetail(friend: FriendSummary | null) {
  const friendId = friend?.id ?? null;

  const detailQuery = useQuery({
    ...friendsQueries.detail(friendId ?? 0),
    enabled: friendId !== null,
  });

  const detail = detailQuery.data?.data;
  const friendWithStats = detail?.friend ?? friend;
  const recentWagers = (detail?.recentWagers ?? []).slice(0, 3);

  return {
    detailQuery,
    friendWithStats,
    recentWagers,
  };
}