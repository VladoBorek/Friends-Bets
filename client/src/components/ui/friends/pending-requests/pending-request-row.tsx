import type { FriendRequestSummary } from "@pb138/shared/schemas/friends";
import { Button } from "../../button";
import { FriendPersonCell } from "../friends-person-cell";

type PendingTab = "incoming" | "outgoing";

type PendingRequestRowProps = {
  request: FriendRequestSummary;
  type: PendingTab;
  isAccepting: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onReject: () => void;
};

function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function PendingRequestRow({
  request,
  type,
  isAccepting,
  isRejecting,
  onAccept,
  onReject,
}: PendingRequestRowProps) {
  const person = type === "incoming" ? request.requester : request.addressee;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4">
      <FriendPersonCell username={person.username} email={person.email} />

      {type === "incoming" ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={isRejecting || isAccepting}
            onClick={onReject}
            className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/15"
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>

          <Button
            size="sm"
            disabled={isRejecting || isAccepting}
            onClick={onAccept}
            className="border border-cyan-500/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20"
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled
          title="Cancel request will be enabled after backend support is added."
          className="border border-slate-700 bg-slate-800/70 text-slate-400"
        >
          Cancel soon
        </Button>
      )}
    </div>
  );
}
