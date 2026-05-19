import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { fetchFriendRequestCount } from "../../../api/friends/friends-discovery-api";
import { friendsQueries } from "../../../api/friends/friends-query-options";
import { Route } from "../../../routes/friends";
import { useAuth } from "../../../lib/auth-context";
import { useMediaQuery } from "./use-media-query";

export function useFriendsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user } = useAuth();

  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);

  const friendsQuery = useQuery(friendsQueries.list(search.page));

  const friends = useMemo(() => friendsQuery.data?.data ?? [], [friendsQuery.data?.data]);
  const pagination = friendsQuery.data?.pagination ?? null;
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const incomingRequestsQuery = useQuery({
    queryKey: ["friend-requests-count", user?.id, "incoming"],
    queryFn: () => fetchFriendRequestCount("incoming"),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const incomingRequestCount = incomingRequestsQuery.data ?? 0;

  useEffect(() => {
    if (!friends.length) {
      setSelectedFriendId(null);
      return;
    }

    const selectedStillExists = friends.some((friend) => friend.id === selectedFriendId);

    if (selectedStillExists) {
      return;
    }

    setSelectedFriendId(isDesktop ? friends[0].id : null);
  }, [friends, isDesktop, selectedFriendId]);

  const handleFriendSelect = (friendId: number) => {
    setSelectedFriendId((currentId) => {
      if (isDesktop) {
        return friendId;
      }

      return currentId === friendId ? null : friendId;
    });
  };

  const handlePageChange = (page: number) => {
    void navigate({
      to: "/friends",
      search: { page },
    });
  };

  const handleFriendUpdated = (friend: FriendSummary | null) => {
    setSelectedFriendId(friend?.id ?? null);
  };

  return {
    search,
    friendsQuery,
    friends,
    pagination,
    totalPages,
    selectedFriend,
    selectedFriendId,
    setSelectedFriendId,
    isAddFriendDialogOpen,
    setIsAddFriendDialogOpen,
    isPendingDialogOpen,
    setIsPendingDialogOpen,
    incomingRequestCount,
    hasIncomingRequests: incomingRequestCount > 0,
    handleFriendSelect,
    handleFriendUpdated,
    handlePageChange,
  };
}