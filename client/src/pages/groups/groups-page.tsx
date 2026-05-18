import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Clock3 } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { groupsQueries } from "../../api/groups/groups-query-options";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { CreateGroupDialog } from "../../components/ui/groups/create-group-dialog";
import { GroupDetailDialog } from "../../components/ui/groups/group-detail-dialog";
import { GroupListSection } from "../../components/ui/groups/group-list-section";
import { Route } from "../../routes/groups";
import { fetchGroupInvitationCount } from "../../api/groups/group-invitations-api";
import { PendingGroupInvitationsDialog } from "../../components/ui/groups/pending-group-invitations-dialog";
import { useAuth } from "../../lib/auth-context";


export function GroupsPage() {
  const { user } = useAuth();
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);

  const incomingInvitesQuery = useQuery({
    queryKey: ["group-invitations-count", user?.id, "incoming"],
    queryFn: () => fetchGroupInvitationCount("incoming"),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const incomingInviteCount = incomingInvitesQuery.data ?? 0;
  const hasIncomingInvites = incomingInviteCount > 0;

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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsPendingDialogOpen(true)}
            className="relative gap-2 border border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800"
          >
            <Clock3 className="h-4 w-4" />
            Pending
            {hasIncomingInvites ? (
              <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full border border-slate-950 bg-rose-500" />
            ) : null}
          </Button>

          <Button type="button" onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </div>
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
        onGroupUpdated={setSelectedGroup}
      />

      <PendingGroupInvitationsDialog
        open={isPendingDialogOpen}
        onOpenChange={setIsPendingDialogOpen}
      />
      <CreateGroupDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}