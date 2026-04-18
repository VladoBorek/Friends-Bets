import type { FriendRequestSummary } from "@pb138/shared/schemas/friends";
import { PendingRequestRow } from "./pending-request-row";

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
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {error instanceof Error ? error.message : "Unable to load pending requests."}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
        {type === "incoming"
          ? "No incoming friend requests."
          : "No outgoing friend requests."}
      </div>
    );
  }

  return (
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
  );
}
