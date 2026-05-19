import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { getInitials, formatRecord } from "../../utils/friend-display";

type FriendDetailHeaderProps = {
  friend: FriendSummary;
};

export function FriendDetailHeader({ friend }: FriendDetailHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-lg font-semibold text-indigo-200 sm:size-14 sm:text-xl">
        {getInitials(friend.username)}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="break-words text-xl font-semibold text-slate-100 sm:text-2xl">
          You vs. {friend.username}
        </h2>
        <p className="mt-1 break-words text-sm text-slate-400">
          Head-to-head record: {formatRecord(friend, { includeZeroDraws: true })}
        </p>
      </div>
    </div>
  );
}