import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFriends } from "../../../api/friends/friends-api";
import { fetchAllGroupInvitations, sendGroupInvitation } from "../../../api/groups/group-invitations-api";
import { fetchAllGroupMembers } from "../../../api/groups/group-members-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import { Button } from "../../../components/ui/utils/button";
import { Dialog } from "../../../components/ui/utils/dialog";
import { FriendsDialogShell } from "../../friends/components/dialog/friends-dialog-shell";
import { FriendsPagination } from "../../friends/components/friends-pagination";
const INVITE_PAGE_SIZE = 8;

type InviteGroupMemberDialogProps = {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteGroupMemberDialog({ groupId, open, onOpenChange }: InviteGroupMemberDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const [optimisticPendingUserIds, setOptimisticPendingUserIds] = useState<Set<number>>(new Set());

  const friendsQuery = useQuery({
    queryKey: ["groups", "invite-friends", groupId, user?.id, page],
    queryFn: () =>
      fetchFriends({
        page,
        limit: INVITE_PAGE_SIZE,
      }),
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

  const joinedUserIds = useMemo(
    () => new Set((membersQuery.data ?? []).map((member) => member.id)),
    [membersQuery.data],
  );

  const pendingUserIds = useMemo(() => {
    const ids = new Set<number>(optimisticPendingUserIds);

    for (const invite of outgoingInvitesQuery.data ?? []) {
      if (invite.group.id === groupId && invite.status === "PENDING") {
        ids.add(invite.addressee.id);
      }
    }

    return ids;
  }, [groupId, optimisticPendingUserIds, outgoingInvitesQuery.data]);

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => sendGroupInvitation(groupId, userId),
    onMutate: (userId) => setSubmittingUserId(userId),
    onSuccess: async (invite) => {
      setOptimisticPendingUserIds((current) => {
        const next = new Set(current);
        next.add(invite.addressee.id);
        return next;
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Invite Friend" contentClassName="sm:max-w-3xl">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{pagination?.total ?? 0} friends</span>
          <span>
            Page {page} / {totalPages}
          </span>
        </div>

        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {friendsQuery.isLoading ? (
            <p className="rounded-2xl border border-slate-800 p-4 text-sm text-slate-400">Loading friends...</p>
          ) : friendsQuery.isError ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
              {friendsQuery.error instanceof Error ? friendsQuery.error.message : "Unable to load friends."}
            </p>
          ) : friends.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-400">
              No friends available to invite.
            </p>
          ) : (
            friends.map((friend) => {
              const isJoined = joinedUserIds.has(friend.id);
              const isPending = pendingUserIds.has(friend.id);
              const isSubmitting = submittingUserId === friend.id;
              const isDisabled = isJoined || isPending || isSubmitting;

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{friend.username}</p>
                    <p className="truncate text-xs text-slate-500">{friend.email}</p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isDisabled}
                    onClick={() => inviteMutation.mutate(friend.id)}
                    className={
                      isJoined
                        ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10"
                        : isPending
                          ? "border border-slate-700 bg-slate-800/70 text-slate-400 hover:bg-slate-800/70"
                          : undefined
                    }
                  >
                    {isJoined ? "Joined" : isPending ? "Pending" : isSubmitting ? "Inviting..." : "Invite"}
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <FriendsPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </FriendsDialogShell>
    </Dialog>
  );
}