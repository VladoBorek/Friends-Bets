import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { Button } from "../../../../components/ui/button";

type InviteFriendRowProps = {
  friend: FriendSummary;
  isJoined: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  onInvite: (userId: number) => void;
};

export function InviteFriendRow({ friend, isJoined, isPending, isSubmitting, onInvite }: InviteFriendRowProps) {
  const isDisabled = isJoined || isPending || isSubmitting;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">{friend.username}</p>
        <p className="truncate text-xs text-slate-500">{friend.email}</p>
      </div>

      <Button
        type="button"
        size="sm"
        disabled={isDisabled}
        onClick={() => onInvite(friend.id)}
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
}