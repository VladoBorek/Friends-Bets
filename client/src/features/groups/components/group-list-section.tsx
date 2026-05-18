import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { Card } from "../../../components/ui/utils/card";
import { FriendsPagination } from "../../friends/components/friends-pagination";
import { GroupCard } from "./group-card";

type GroupListSectionProps = {
  groups: GroupSummary[];
  totalGroups: number;
  currentPage: number;
  totalPages: number;
  selectedGroupId: number | null;
  isRefreshing: boolean;
  onGroupSelect: (group: GroupSummary) => void;
  onPageChange: (page: number) => void;
};

export function GroupListSection({
  groups,
  totalGroups,
  currentPage,
  totalPages,
  selectedGroupId,
  isRefreshing,
  onGroupSelect,
  onPageChange,
}: GroupListSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{totalGroups} groups</span>
        <span>
          Page {currentPage} / {totalPages}
        </span>
      </div>

      {groups.length === 0 ? (
        <Card className="rounded-2xl border-slate-800 p-5 text-sm text-slate-400">
          No groups found.
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isSelected={group.id === selectedGroupId}
              onClick={() => onGroupSelect(group)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <div className="text-center text-xs text-slate-500">
          {isRefreshing ? "Refreshing..." : " "}
        </div>

        <FriendsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}
