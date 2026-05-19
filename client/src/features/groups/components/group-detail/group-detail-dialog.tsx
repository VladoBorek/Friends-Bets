import { Pencil } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { Button } from "../../../../components/ui/button";
import { Dialog } from "../../../../components/ui/dialog";
import { FriendsDialogShell } from "../../../friends/components/dialog/friends-dialog-shell";
import { useGroupDetail } from "../../hooks/use-group-detail";
import { EditGroupDialog } from "./edit-group-dialog";
import { GroupDetailSummaryCard } from "./group-detail-summary-card";
import { GroupMemberList } from "./group-member-list";
import { InviteGroupMemberDialog } from "./invite-group-member-dialog";

type GroupDetailDialogProps = {
  group: GroupSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated?: (group: GroupSummary) => void;
};

export function GroupDetailDialog({ group, open, onOpenChange, onGroupUpdated }: GroupDetailDialogProps) {
  const detail = useGroupDetail(group, open, onOpenChange);

  if (!group) return null;

  const pagination = detail.membersQuery.data?.pagination ?? null;
  const members = detail.membersQuery.data?.data ?? [];
  const memberCount = pagination?.total ?? group.memberCount;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <FriendsDialogShell
          title={group.name}
          contentClassName="w-[calc(100vw-1rem)] max-h-[calc(100dvh-2rem)] sm:max-w-5xl"
          bodyClassName="max-h-[calc(100dvh-8rem)] overflow-y-auto xl:overflow-hidden"
          headerActions={
            detail.canManage ? (
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100" onClick={() => detail.setIsEditOpen(true)} aria-label="Edit group" title="Edit group">
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null
          }
        >
          <div className="flex flex-col gap-4 xl:h-[calc(100dvh-12rem)] xl:min-h-0 xl:flex-row">
            <GroupDetailSummaryCard
              group={group}
              memberCount={memberCount}
              canManage={detail.canManage}
              isDescriptionExpanded={detail.isDescriptionExpanded}
              isLeaving={detail.leaveMutation.isPending}
              isDeleting={detail.deleteMutation.isPending}
              onDescriptionToggle={() => detail.setIsDescriptionExpanded((current) => !current)}
              onInviteClick={() => detail.setIsInviteOpen(true)}
              onLeaveClick={() => detail.leaveMutation.mutate()}
              onDeleteClick={() => detail.deleteMutation.mutate()}
            />

            <GroupMemberList
              members={members}
              memberCount={memberCount}
              memberPage={detail.memberPage}
              totalPages={totalPages}
              currentUserId={detail.user?.id}
              canManage={detail.canManage}
              isLoading={detail.membersQuery.isLoading}
              error={detail.membersQuery.error}
              removingUserId={detail.removingUserId}
              onRemove={(userId) => detail.removeMemberMutation.mutate(userId)}
              onPageChange={detail.setMemberPage}
            />
          </div>
        </FriendsDialogShell>
      </Dialog>

      <InviteGroupMemberDialog groupId={group.id} open={detail.isInviteOpen} onOpenChange={detail.setIsInviteOpen} />
      <EditGroupDialog group={group} open={detail.isEditOpen} onOpenChange={detail.setIsEditOpen} onGroupUpdated={onGroupUpdated} />
    </>
  );
}