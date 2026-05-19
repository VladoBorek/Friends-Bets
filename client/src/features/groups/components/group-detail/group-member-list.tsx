import type { GroupMemberSummary } from "@pb138/shared/schemas/groups";
import { Card } from "../../../../components/ui/card";
import { FriendsPagination } from "../../../friends/components/friends-pagination";
import { GroupMemberRow } from "./group-member-row";

type GroupMemberListProps = {
  members: GroupMemberSummary[];
  memberCount: number;
  memberPage: number;
  totalPages: number;
  currentUserId: number | undefined;
  canManage: boolean;
  isLoading: boolean;
  error: unknown;
  removingUserId: number | null;
  onRemove: (userId: number) => void;
  onPageChange: (page: number) => void;
};

export function GroupMemberList({ members, memberCount, memberPage, totalPages, currentUserId, canManage, isLoading, error, removingUserId, onRemove, onPageChange }: GroupMemberListProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3 xl:min-h-0 xl:flex-1">
      <div className="flex shrink-0 items-center justify-between text-sm text-slate-400">
        <span>{memberCount} members</span>
        <span>Page {memberPage} / {totalPages}</span>
      </div>

      <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2">
        {isLoading ? (
          <Card className="rounded-2xl border-slate-800 p-4 text-sm text-slate-400">Loading members...</Card>
        ) : error ? (
          <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error instanceof Error ? error.message : "Unable to load members."}
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((member) => (
              <GroupMemberRow key={member.id} member={member} canRemove={Boolean(canManage && member.id !== currentUserId)} isRemoving={removingUserId === member.id} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 pb-2">
        <FriendsPagination currentPage={memberPage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </section>
  );
}