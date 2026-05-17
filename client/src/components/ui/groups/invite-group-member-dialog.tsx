// client/src/components/ui/groups/invite-group-member-dialog.tsx
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchFriends } from "../../../api/friends-api";
import { addGroupMember } from "../../../api/groups/group-members-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { FriendsDialogShell } from "../friends/dialog/friends-dialog-shell";
import { FriendsPagination } from "../friends/friends-pagination";

const INVITE_PAGE_SIZE = 8;

type InviteGroupMemberDialogProps = {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteGroupMemberDialog({
  groupId,
  open,
  onOpenChange,
}: InviteGroupMemberDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);

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

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => addGroupMember(groupId, { userId, role: "MEMBER" }),
    onMutate: (userId) => setSubmittingUserId(userId),
    onSuccess: async () => {
      toast.success("Friend invited");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["groups", "members", groupId] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to invite friend"),
    onSettled: () => setSubmittingUserId(null),
  });

  useEffect(() => {
    if (!open) {
      setPage(1);
      setSubmittingUserId(null);
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
            <p className="rounded-2xl border border-slate-800 p-4 text-sm text-slate-400">
              Loading friends...
            </p>
          ) : friendsQuery.isError ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
              {friendsQuery.error instanceof Error ? friendsQuery.error.message : "Unable to load friends."}
            </p>
          ) : friends.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-400">
              No friends available to invite.
            </p>
          ) : (
            friends.map((friend) => (
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
                  disabled={submittingUserId === friend.id}
                  onClick={() => inviteMutation.mutate(friend.id)}
                >
                  {submittingUserId === friend.id ? "Inviting..." : "Invite"}
                </Button>
              </div>
            ))
          )}
        </div>

        <FriendsPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </FriendsDialogShell>
    </Dialog>
  );
}