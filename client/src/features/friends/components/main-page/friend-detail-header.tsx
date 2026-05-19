import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { getInitials, formatRecord } from "../../utils/friend-display";

type FriendDetailHeaderProps = {
  friend: FriendSummary;
};

export function FriendDetailHeader({ friend }: FriendDetailHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid size-14 place-items-center rounded-full bg-indigo-500/15 text-xl font-semibold text-indigo-200">
        {getInitials(friend.username)}
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-2xl font-semibold text-slate-100">
          You vs. {friend.username}
        </h2>
        <p className="mt-1 truncate text-sm text-slate-400">
          Head-to-head record: {formatRecord(friend, { includeZeroDraws: true })}
        </p>
      </div>
    </div>
  );
}