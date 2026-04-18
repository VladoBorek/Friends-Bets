import type { UserSummary } from "@pb138/shared/schemas/user";
import { FriendsAsyncState } from "../friends-async-state";
import { AddFriendRow } from "./add-friend-row";

type AddFriendListProps = {
  visibleUsers: UserSummary[];
  friendIds: number[];
  pendingIds: number[];
  submittingUserId: number | null;
  isLoading: boolean;
  error: unknown;
  onSendRequest: (candidateId: number) => void;
};

export function AddFriendList({
  visibleUsers,
  friendIds,
  pendingIds,
  submittingUserId,
  isLoading,
  error,
  onSendRequest,
}: AddFriendListProps) {
  return (
    <FriendsAsyncState
      isLoading={isLoading}
      error={error}
      isEmpty={visibleUsers.length === 0}
      emptyMessage="No users match your search."
      skeletonCount={5}
      errorMessage="Unable to load add-friend data."
    >
      <div className="flex flex-col gap-3">
        {visibleUsers.map((candidate) => (
          <AddFriendRow
            key={candidate.id}
            candidate={candidate}
            friendIds={friendIds}
            pendingIds={pendingIds}
            isSending={submittingUserId === candidate.id}
            onSendRequest={onSendRequest}
          />
        ))}
      </div>
    </FriendsAsyncState>
  );
}
