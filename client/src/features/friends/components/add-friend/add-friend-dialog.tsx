import { Search } from "lucide-react";
import { Dialog } from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { FriendsDialogShell } from "../dialog/friends-dialog-shell";
import { FriendsPagination } from "../friends-pagination";
import { useAddFriend } from "../../hooks/use-add-friend";
import { AddFriendList } from "./add-friend-list";

type AddFriendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddFriendDialog({ open, onOpenChange }: AddFriendDialogProps) {
  const addFriend = useAddFriend(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell
        title="Add Friend"
        contentClassName="sm:max-w-4xl"
        bodyClassName="flex min-h-0 max-h-[calc(85vh-88px)] flex-col gap-4 px-6 py-5"
      >
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={addFriend.query}
            onChange={(event) => addFriend.setQuery(event.target.value)}
            placeholder="Search by username or email..."
            className="pl-10"
          />
        </div>

        <div className="flex shrink-0 items-center justify-between text-sm text-slate-400">
          <span>{addFriend.pagination?.total ?? 0} users</span>
          <span>Page {addFriend.page} / {addFriend.totalPages}</span>
        </div>

        <div className="max-h-[26rem] overflow-y-auto pr-1">
          <AddFriendList
            visibleUsers={addFriend.discoveredUsers}
            submittingUserId={addFriend.submittingUserId}
            isLoading={addFriend.discoveryQuery.isLoading}
            error={addFriend.discoveryQuery.error}
            onSendRequest={(candidateId) => addFriend.sendRequestMutation.mutate(candidateId)}
          />
        </div>

        <FriendsPagination
          currentPage={addFriend.page}
          totalPages={addFriend.totalPages}
          onPageChange={addFriend.setPage}
        />
      </FriendsDialogShell>
    </Dialog>
  );
}