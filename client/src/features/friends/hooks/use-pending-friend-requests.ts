import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  acceptFriendRequest,
  fetchAllFriendRequests,
  rejectFriendRequest,
} from "../../../api/friends/friends-discovery-api";
import { friendsKeys } from "../../../api/friends/friends-query-options";
import { useAuth } from "../../../lib/auth-context";
import type { PendingFriendRequestTab } from "../utils/friend-requests";

export function usePendingFriendRequests(open: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<PendingFriendRequestTab>("incoming");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingActionType, setPendingActionType] = useState<"accept" | "reject" | null>(null);

  const requestKeys = {
    all: ["friend-requests", user?.id] as const,
    list: (direction: PendingFriendRequestTab) => ["friend-requests", user?.id, direction] as const,
  };

  const incomingQuery = useQuery({
    queryKey: requestKeys.list("incoming"),
    queryFn: () => fetchAllFriendRequests("incoming"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const outgoingQuery = useQuery({
    queryKey: requestKeys.list("outgoing"),
    queryFn: () => fetchAllFriendRequests("outgoing"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onMutate: (requestId) => {
      setPendingActionId(requestId);
      setPendingActionType("accept");
    },
    onSuccess: async () => {
      toast.success("Friend request accepted");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: requestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: friendsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friends", "discover", user?.id] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to accept friend request");
    },
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onMutate: (requestId) => {
      setPendingActionId(requestId);
      setPendingActionType("reject");
    },
    onSuccess: async () => {
      toast.success("Friend request rejected");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: requestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: friendsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friends", "discover", user?.id] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to reject friend request");
    },
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const activeQuery = activeTab === "incoming" ? incomingQuery : outgoingQuery;
  const requests = activeQuery.data ?? [];

  const counts = useMemo(
    () => ({
      incoming: incomingQuery.data?.length ?? 0,
      outgoing: outgoingQuery.data?.length ?? 0,
    }),
    [incomingQuery.data, outgoingQuery.data],
  );

  return {
    activeTab,
    setActiveTab,
    activeQuery,
    requests,
    counts,
    pendingActionId,
    pendingActionType,
    acceptMutation,
    rejectMutation,
  };
}