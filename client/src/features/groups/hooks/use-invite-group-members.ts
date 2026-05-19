import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFriends } from "../../../api/friends/friends-api";
import { fetchAllGroupInvitations, sendGroupInvitation } from "../../../api/groups/group-invitations-api";
import { fetchAllGroupMembers } from "../../../api/groups/group-members-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";

const INVITE_PAGE_SIZE = 8;

export function useInviteGroupMembers(groupId: number, open: boolean) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const [optimisticPendingUserIds, setOptimisticPendingUserIds] = useState<Set<number>>(new Set());

  const friendsQuery = useQuery({
    queryKey: ["groups", "invite-friends", groupId, user?.id, page],
    queryFn: () => fetchFriends({ page, limit: INVITE_PAGE_SIZE }),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const membersQuery = useQuery({
    queryKey: ["groups", "invite-members", groupId],
    queryFn: () => fetchAllGroupMembers(groupId),
    enabled: open && Boolean(groupId),
    staleTime: 0,
  });

  const outgoingInvitesQuery = useQuery({
    queryKey: ["group-invitations", user?.id, "outgoing", groupId],
    queryFn: () => fetchAllGroupInvitations("outgoing"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const joinedUserIds = useMemo(() => new Set((membersQuery.data ?? []).map((member) => member.id)), [membersQuery.data]);

  const pendingUserIds = useMemo(() => {
    const ids = new Set<number>(optimisticPendingUserIds);

    for (const invite of outgoingInvitesQuery.data ?? []) {
      if (invite.group.id === groupId && invite.status === "PENDING") ids.add(invite.addressee.id);
    }

    return ids;
  }, [groupId, optimisticPendingUserIds, outgoingInvitesQuery.data]);

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => sendGroupInvitation(groupId, userId),
    onMutate: setSubmittingUserId,
    onSuccess: async (invite) => {
      setOptimisticPendingUserIds((current) => new Set(current).add(invite.addressee.id));
      toast.success("Group invitation sent");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["groups", "members", groupId] }),
        queryClient.invalidateQueries({ queryKey: ["groups", "invite-members", groupId] }),
        queryClient.invalidateQueries({ queryKey: ["group-invitations", user?.id] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to invite friend"),
    onSettled: () => setSubmittingUserId(null),
  });

  useEffect(() => {
    if (!open) {
      setPage(1);
      setSubmittingUserId(null);
      setOptimisticPendingUserIds(new Set());
    }
  }, [open]);

  const friends = friendsQuery.data?.data ?? [];
  const pagination = friendsQuery.data?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return { page, setPage, friends, pagination, totalPages, friendsQuery, joinedUserIds, pendingUserIds, submittingUserId, inviteMutation };
}