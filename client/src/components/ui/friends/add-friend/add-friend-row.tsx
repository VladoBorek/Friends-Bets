import type { UserSummary } from "@pb138/shared/schemas/user";
import { UserPlus } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { Button } from "../../button";
import { FriendPersonCell } from "../friends-person-cell";
import {
  buildButtonLabel,
  getRelationshipState,
} from "./add-friend-dialog-utils";

type AddFriendRowProps = {
  candidate: UserSummary;
  friendIds: number[];
  pendingIds: number[];
  isSending: boolean;
  onSendRequest: (candidateId: number) => void;
};

export function AddFriendRow({
  candidate,
  friendIds,
  pendingIds,
  isSending,
  onSendRequest,
}: AddFriendRowProps) {
  const state = getRelationshipState(candidate.id, friendIds, pendingIds);
  const isDisabled = state !== "add" || isSending;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 transition-colors hover:border-cyan-500/20 hover:bg-slate-950/70">
      <FriendPersonCell username={candidate.username} email={candidate.email} />

      <Button
        size="sm"
        disabled={isDisabled}
        onClick={() => onSendRequest(candidate.id)}
        title={
          state === "friends"
            ? "You are already friends"
            : state === "request-sent"
              ? "A friend request already exists"
              : "Send friend request"
        }
        className={cn(
          "min-w-28",
          state === "friends" &&
            "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10",
          state === "request-sent" &&
            "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/10",
        )}
      >
        {state === "add" && !isSending ? (
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
