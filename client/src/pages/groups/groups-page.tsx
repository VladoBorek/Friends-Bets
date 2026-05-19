import { Card } from "../../components/ui/card";
import { CreateGroupDialog } from "../../features/groups/components/create-group/create-group-dialog";
import { GroupDetailDialog } from "../../features/groups/components/group-detail/group-detail-dialog";
import { GroupListSection } from "../../features/groups/components/main-page/group-list-section";
import { GroupsPageHeader } from "../../features/groups/components/main-page/groups-page-header";
import { PendingGroupInvitationsDialog } from "../../features/groups/components/pending-invites/pending-group-invitations-dialog";
import { useGroupsPage } from "../../features/groups/hooks/use-groups-page";

export function GroupsPage() {
  const page = useGroupsPage();

  if (page.groupsQuery.isLoading) {
    return <Card className="rounded-2xl border-slate-800 p-6 text-sm text-slate-400">Loading groups...</Card>;
  }

  if (page.groupsQuery.isError) {
    return (
      <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-200">
        {page.groupsQuery.error instanceof Error ? page.groupsQuery.error.message : "Unable to load groups."}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GroupsPageHeader
        hasIncomingInvites={page.hasIncomingInvites}
        onPendingClick={() => page.setIsPendingDialogOpen(true)}
        onCreateClick={() => page.setIsCreateOpen(true)}
      />

      <GroupListSection
        groups={page.groups}
        totalGroups={page.pagination?.total ?? 0}
        currentPage={page.search.page}
        totalPages={page.totalPages}
        selectedGroupId={page.selectedGroup?.id ?? null}
        isRefreshing={page.groupsQuery.isFetching}
        onGroupSelect={page.setSelectedGroup}
        onPageChange={page.handlePageChange}
      />

      <GroupDetailDialog
        group={page.selectedGroup}
        open={page.selectedGroup !== null}
        onOpenChange={(open) => {
          if (!open) page.setSelectedGroup(null);
        }}
        onGroupUpdated={page.setSelectedGroup}
      />

      <PendingGroupInvitationsDialog open={page.isPendingDialogOpen} onOpenChange={page.setIsPendingDialogOpen} />
      <CreateGroupDialog open={page.isCreateOpen} onOpenChange={page.setIsCreateOpen} />
    </div>
  );
}