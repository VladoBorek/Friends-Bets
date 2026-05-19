import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { formatRecord, getInitials } from "../../utils/friend-display";

type FriendDetailHeaderProps = {
  friend: FriendSummary;
};

export function FriendDetailHeader({ friend }: FriendDetailHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-base font-semibold text-indigo-200">
        {getInitials(friend.username)}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-semibold text-slate-100">
          You vs. {friend.username}
        </h2>
        <p className="mt-0.5 truncate text-sm text-slate-400">
          Head-to-head record: {formatRecord(friend, { includeZeroDraws: true })}
        </p>
      </div>
    </div>
  );
}