import { Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { FriendsPagination } from "../../friends/components/friends-pagination";
import type { AdminGroupSummary, GroupActions } from "../hooks/use-groups";

type PaginationState = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

interface GroupsPanelProps {
  groups: AdminGroupSummary[];
  isLoading: boolean;
  query: string;
  pagination: PaginationState | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onQueryChange: (query: string) => void;
  onSelectGroup: (group: AdminGroupSummary) => void;
  actions: GroupActions;
}

export function GroupsPanel({
  groups,
  isLoading,
  query,
  pagination,
  currentPage,
  totalPages,
  onPageChange,
  onQueryChange,
  onSelectGroup,
  actions,
}: GroupsPanelProps) {
  const firstVisible = pagination && pagination.total > 0
    ? Math.min(pagination.offset + 1, pagination.total)
    : 0;
  const lastVisible = pagination
    ? Math.min(pagination.offset + groups.length, pagination.total)
    : groups.length;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Groups Table</h2>
          {pagination && pagination.total > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Showing {firstVisible}-{lastVisible} of {pagination.total}
            </p>
          )}
        </div>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="search groups by name..."
          className="sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-xl border border-slate-800 bg-slate-900/50">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No matching groups found.</div>
        ) : (
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[200px]" />
              <col className="w-[110px]" />
              <col className="w-[130px]" />
              <col className="w-[72px]" />
            </colgroup>
            <thead className="border-b border-slate-800/50 bg-slate-900/80">
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Name</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Description</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Members</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Active Wagers</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-slate-800/50">
              {groups.map((group) => (
                <tr
                  key={group.id}
                  className="cursor-pointer hover:bg-slate-800/40"
                  onClick={() => onSelectGroup(group)}
                >
                  <td className="px-6 py-4 font-medium text-slate-200">{group.name}</td>
                  <td className="px-6 py-4 text-slate-400">
                    {group.description ? group.description : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{group.memberCount}</td>
                  <td className="px-6 py-4 text-slate-400">{group.activeWagerCount}</td>
                  <td className="px-2 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        void actions.deleteGroup(group);
                      }}
                      disabled={group.activeWagerCount > 0}
                      className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 disabled:text-slate-500"
                      aria-label={`Delete group ${group.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && pagination && pagination.total > 0 && (
        <div className="mt-5">
          <FriendsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
