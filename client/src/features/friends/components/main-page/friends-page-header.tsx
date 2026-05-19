import { Clock3, UserPlus } from "lucide-react";
import { Button } from "../../../../components/ui/button";

type FriendsPageHeaderProps = {
  hasIncomingRequests: boolean;
  incomingRequestCount: number;
  onPendingClick: () => void;
  onAddFriendClick: () => void;
};

export function FriendsPageHeader({
  hasIncomingRequests,
  incomingRequestCount,
  onPendingClick,
  onAddFriendClick,
}: FriendsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-slate-100">Friends</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={onPendingClick}
          className="relative gap-2 border border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800"
        >
          <Clock3 className="h-4 w-4" />
          Pending

          {hasIncomingRequests ? (
            <>
              <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full border border-slate-950 bg-rose-500" />
              <span className="sr-only">
                {incomingRequestCount} pending incoming friend request
                {incomingRequestCount === 1 ? "" : "s"}
              </span>
            </>
          ) : null}
        </Button>

        <Button onClick={onAddFriendClick} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Friend
        </Button>
      </div>
    </div>
  );
}