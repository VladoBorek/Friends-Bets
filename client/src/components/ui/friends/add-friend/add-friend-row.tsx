import { UserPlus } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Button } from "../../button";
import { FriendPersonCell } from "../dialog/friends-person-cell";
import {buildButtonLabel,} from "./add-friend-dialog-utils";
import type { DiscoveredUser } from "@pb138/shared/schemas/friends";

type AddFriendRowProps = {
  candidate: DiscoveredUser;
  isSending: boolean;
  onSendRequest: (candidateId: number) => void;
};

export function AddFriendRow({
  candidate,
  isSending,
  onSendRequest,
}: AddFriendRowProps) {
  const state = candidate.relationshipState;
  const isDisabled = state !== "AVAILABLE" || isSending;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 transition-colors hover:border-cyan-500/20 hover:bg-slate-950/70">
      <FriendPersonCell username={candidate.username} email={candidate.email} />

      <Button
        size="sm"
        disabled={isDisabled}
        onClick={() => onSendRequest(candidate.id)}
        title={
          state === "FRIENDS"
            ? "You are already friends"
            : state === "OUTGOING_PENDING" || state === "INCOMING_PENDING"
              ? "A friend request already exists"
              : "Send friend request"
        }
        className={cn(
          "min-w-28",
          state === "FRIENDS" &&
            "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10",
          (state === "OUTGOING_PENDING" || state === "INCOMING_PENDING") &&
            "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/10",
        )}
      >
        {state === "AVAILABLE" && !isSending ? (
          <>
            <UserPlus className="mr-1 h-4 w-4" />
            Add
          </>
        ) : (
          buildButtonLabel(state, isSending)
        )}
      </Button>
    </div>
  );
}
