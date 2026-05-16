import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { groupsQueries } from "../../api/groups/groups-query-options";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { CreateGroupDialog } from "../../components/ui/groups/create-group-dialog";
import { GroupDetailDialog } from "../../components/ui/groups/group-detail-dialog";
import { GroupListSection } from "../../components/ui/groups/group-list-section";
import { Route } from "../../routes/groups";

export function GroupsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [selectedGroup, setSelectedGroup] = useState<GroupSummary | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const groupsQuery = useQuery({
    ...groupsQueries.list(search.page),
    placeholderData: keepPreviousData,
  });

  const groups = useMemo(() => groupsQuery.data?.data ?? [], [groupsQuery.data?.data]);
  const pagination = groupsQuery.data?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const handlePageChange = (page: number) => {
    void navigate({
      to: "/groups",
      search: { page },
      resetScroll: false,
    });
  };

  if (groupsQuery.isLoading) {
    return (
      <Card className="rounded-2xl border-slate-800 p-6 text-sm text-slate-400">
        Loading groups...
      </Card>
    );
  }

  if (groupsQuery.isError) {
    return (
      <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-200">
        {groupsQuery.error instanceof Error ? groupsQuery.error.message : "Unable to load groups."}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Groups</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage private groups, members, and group activity.
          </p>
        </div>

        <Button type="button" onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      <GroupListSection
        groups={groups}
        totalGroups={pagination?.total ?? 0}
        currentPage={search.page}
        totalPages={totalPages}
        selectedGroupId={selectedGroup?.id ?? null}
        isRefreshing={groupsQuery.isFetching}
        onGroupSelect={setSelectedGroup}
        onPageChange={handlePageChange}
      />

      <GroupDetailDialog
        group={selectedGroup}
        open={selectedGroup !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedGroup(null);
        }}
      />

      <CreateGroupDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}