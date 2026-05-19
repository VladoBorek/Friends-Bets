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
      <Card className="rounded-2xl border-slate-800 p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Friend Summary</h2>
          <p className="text-sm text-slate-400">Select a friend to open the detail panel.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("rounded-2xl border border-cyan-500/15 bg-slate-900/80 p-5")}>
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