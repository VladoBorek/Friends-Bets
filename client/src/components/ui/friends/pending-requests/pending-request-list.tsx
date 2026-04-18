import type { FriendRequestSummary } from "@pb138/shared/schemas/friends";
import { PendingRequestRow } from "./pending-request-row";
import { FriendsAsyncState } from "../friends-async-state";

type PendingTab = "incoming" | "outgoing";

type PendingRequestListProps = {
  type: PendingTab;
  requests: FriendRequestSummary[];
  isLoading: boolean;
  error: unknown;
  pendingActionId: number | null;
  pendingActionType: "accept" | "reject" | null;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

export function PendingRequestList({
  type,
  requests,
  isLoading,
  error,
  pendingActionId,
  pendingActionType,
  onAccept,
  onReject,
}: PendingRequestListProps) {
  return (
    <FriendsAsyncState
      isLoading={isLoading}
      error={error}
      isEmpty={requests.length === 0}
      emptyMessage={
        type === "incoming"
          ? "No incoming friend requests."
          : "No outgoing friend requests."
      }
      skeletonCount={4}
      errorMessage="Unable to load pending requests."
    >
      <div className="flex max-h-[24rem] flex-col gap-3 overflow-y-auto pr-1">
        {requests.map((request) => (
          <PendingRequestRow
            key={request.id}
            request={request}
            type={type}
            isAccepting={pendingActionId === request.id && pendingActionType === "accept"}
            isRejecting={pendingActionId === request.id && pendingActionType === "reject"}
            onAccept={() => onAccept(request.id)}
            onReject={() => onReject(request.id)}
          />
        ))}
      </div>
    </FriendsAsyncState>
  );
}
