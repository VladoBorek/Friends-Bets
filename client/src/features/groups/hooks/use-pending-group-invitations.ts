import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acceptGroupInvitation, fetchAllGroupInvitations, rejectGroupInvitation } from "../../../api/groups/group-invitations-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import type { PendingGroupInviteTab } from "../utils/group-invitations";

export function usePendingGroupInvitations(open: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<PendingGroupInviteTab>("incoming");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingActionType, setPendingActionType] = useState<"accept" | "reject" | null>(null);
  const [expandedInviteId, setExpandedInviteId] = useState<number | null>(null);

  const invitationKeys = {
    all: ["group-invitations", user?.id] as const,
    list: (direction: PendingGroupInviteTab) => ["group-invitations", user?.id, direction] as const,
  };

  const incomingQuery = useQuery({
    queryKey: invitationKeys.list("incoming"),
    queryFn: () => fetchAllGroupInvitations("incoming"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const outgoingQuery = useQuery({
    queryKey: invitationKeys.list("outgoing"),
    queryFn: () => fetchAllGroupInvitations("outgoing"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptGroupInvitation,
    onMutate: (id) => {
      setPendingActionId(id);
      setPendingActionType("accept");
    },
    onSuccess: async () => {
      toast.success("Group invitation accepted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["group-invitations-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: groupsKeys.all }),
      ]);
    },
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectGroupInvitation,
    onMutate: (id) => {
      setPendingActionId(id);
      setPendingActionType("reject");
    },
    onSuccess: async () => {
      toast.success("Group invitation rejected");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["group-invitations-count", user?.id] }),
      ]);
    },
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const activeQuery = activeTab === "incoming" ? incomingQuery : outgoingQuery;
  const invitations = activeQuery.data ?? [];

  const counts = useMemo(() => ({
    incoming: incomingQuery.data?.length ?? 0,
    outgoing: outgoingQuery.data?.length ?? 0,
  }), [incomingQuery.data, outgoingQuery.data]);

  return {
    activeTab,
    setActiveTab,
    activeQuery,
    invitations,
    counts,
    pendingActionId,
    pendingActionType,
    expandedInviteId,
    setExpandedInviteId,
    acceptMutation,
    rejectMutation,
  };
}