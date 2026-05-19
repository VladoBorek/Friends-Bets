import { useDeferredValue, useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchDiscoveredUsers, sendFriendRequest } from "../../../api/friends/friends-discovery-api";
import { friendsKeys } from "../../../api/friends/friends-query-options";
import { useAuth } from "../../../lib/auth-context";
import { DISCOVERY_PAGE_SIZE } from "../utils/friend-discovery";

export function useAddFriend(open: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);

  const deferredQuery = useDeferredValue(query.trim());

  const discoveryQuery = useQuery({
    queryKey: ["friends", "discover", user?.id, deferredQuery, page],
    queryFn: () =>
      fetchDiscoveredUsers({
        page,
        limit: DISCOVERY_PAGE_SIZE,
        query: deferredQuery,
      }),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    placeholderData: keepPreviousData,
  });

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onMutate: setSubmittingUserId,
    onSuccess: async () => {
      toast.success("Friend request sent", {
        description: "The user will now see your request in pending.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["friends", "discover", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: friendsKeys.all }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to send friend request");
    },
    onSettled: () => {
      setSubmittingUserId(null);
    },
  });

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPage(1);
      setSubmittingUserId(null);
    }
  }, [open]);

  const discoveredUsers = discoveryQuery.data?.data ?? [];
  const pagination = discoveryQuery.data?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : page;

  useEffect(() => {
    if (pagination && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pagination, totalPages]);

  return {
    query,
    setQuery,
    page,
    setPage,
    submittingUserId,
    discoveryQuery,
    discoveredUsers,
    pagination,
    totalPages,
    sendRequestMutation,
  };
}