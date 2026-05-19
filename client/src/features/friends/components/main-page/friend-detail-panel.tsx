import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { Card } from "../../../../components/ui/card";
import { cn } from "../../../../lib/utils";
import { useFriendDetail } from "../../hooks/use-friend-detail";
import { FriendDetailHeader } from "./friend-detail-header";
import { FriendDetailStats } from "./friend-detail-stats";
import { RecentWagersSection } from "./recent-wagers-section";

type FriendDetailPanelProps = {
  friend: FriendSummary | null;
};

export function FriendDetailPanel({ friend }: FriendDetailPanelProps) {
  const { detailQuery, friendWithStats, recentWagers } = useFriendDetail(friend);

  if (!friend || !friendWithStats) {
    return (
      <Card className="min-w-0 rounded-2xl border-slate-800 p-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-base font-semibold text-slate-100">Friend Summary</h2>
          <p className="text-sm text-slate-400">Select a friend to open the detail panel.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "min-w-0 w-full rounded-2xl border border-cyan-500/15 bg-slate-900/80 p-4",
        "lg:max-h-[34rem] lg:overflow-hidden",
      )}
    >
      <FriendDetailHeader friend={friendWithStats} />
      <FriendDetailStats friend={friendWithStats} />

      <RecentWagersSection
        friend={friendWithStats}
        recentWagers={recentWagers}
        isLoading={detailQuery.isLoading}
        error={detailQuery.error}
      />
    </Card>
  );
}