import { Dialog } from "../../../../components/ui/dialog";
import { FriendsDialogShell } from "../../../friends/components/dialog/friends-dialog-shell";
import { FriendsPagination } from "../../../friends/components/friends-pagination";
import { useInviteGroupMembers } from "../../hooks/use-invite-group-members";
import { InviteFriendRow } from "./invite-friend-row";

type InviteGroupMemberDialogProps = {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteGroupMemberDialog({ groupId, open, onOpenChange }: InviteGroupMemberDialogProps) {
  const invite = useInviteGroupMembers(groupId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Invite Friend" contentClassName="sm:max-w-3xl">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{invite.pagination?.total ?? 0} friends</span>
          <span>Page {invite.page} / {invite.totalPages}</span>
        </div>

        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {invite.friendsQuery.isLoading ? (
            <p className="rounded-2xl border border-slate-800 p-4 text-sm text-slate-400">Loading friends...</p>
          ) : invite.friendsQuery.isError ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
              {invite.friendsQuery.error instanceof Error ? invite.friendsQuery.error.message : "Unable to load friends."}
            </p>
          ) : invite.friends.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-400">No friends available to invite.</p>
          ) : (
            invite.friends.map((friend) => (
              <InviteFriendRow
                key={friend.id}
                friend={friend}
                isJoined={invite.joinedUserIds.has(friend.id)}
                isPending={invite.pendingUserIds.has(friend.id)}
                isSubmitting={invite.submittingUserId === friend.id}
                onInvite={(userId) => invite.inviteMutation.mutate(userId)}
              />
            ))
          )}
        </div>

        <FriendsPagination currentPage={invite.page} totalPages={invite.totalPages} onPageChange={invite.setPage} />
      </FriendsDialogShell>
    </Dialog>
  );
}