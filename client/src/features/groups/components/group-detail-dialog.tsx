import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Pencil, UserPlus } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { deleteGroup, leaveGroup } from "../../../api/groups/groups-api";
import { removeGroupMember } from "../../../api/groups/group-members-api";
import { groupsKeys, groupsQueries } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import { cn } from "../../../lib/utils";
import { Button } from "../../../components/ui/utils/button";
import { Card } from "../../../components/ui/utils/card";
import { Dialog } from "../../../components/ui/utils/dialog";
import { FriendsDialogShell } from "../../friends/components/dialog/friends-dialog-shell";
import { FriendsPagination } from "../../friends/components/friends-pagination";
import { EditGroupDialog } from "./edit-group-dialog";
import { GroupMemberRow } from "./group-member-row";
import { InviteGroupMemberDialog } from "./invite-group-member-dialog";

type GroupDetailDialogProps = {
  group: GroupSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupUpdated?: (group: GroupSummary) => void;
};

function getMoneyTone(value: string) {
  const numericValue = Number(value);

  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";

  return "text-slate-100";
}

export function GroupDetailDialog({
  group,
  open,
  onOpenChange,
  onGroupUpdated,
}: GroupDetailDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [memberPage, setMemberPage] = useState(1);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const groupId = group?.id ?? 0;
  const canManage = group?.currentUserRole === "OWNER" || user?.roleName === "ADMIN";

  const membersQuery = useQuery({
    ...groupsQueries.members(groupId, memberPage),
    enabled: open && Boolean(group),
    placeholderData: keepPreviousData,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeGroupMember(groupId, userId),
    onMutate: (userId) => setRemovingUserId(userId),
    onSuccess: async () => {
      toast.success("Member removed");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupsKeys.all }),
        queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId, memberPage) }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to remove member"),
    onSettled: () => setRemovingUserId(null),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: async () => {
      toast.success("Left group");
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: groupsKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to leave group"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(groupId),
    onSuccess: async () => {
      toast.success("Group deleted");
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: groupsKeys.all });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete group"),
  });

  if (!group) {
    return null;
  }

  const pagination = membersQuery.data?.pagination ?? null;
  const members = membersQuery.data?.data ?? [];
  const memberCount = pagination?.total ?? group.memberCount;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const description = group.description?.trim() || "No description provided.";
  const canExpandDescription = description.length > 180 || description.includes("\n");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <FriendsDialogShell
          title={group.name}
          contentClassName="w-[calc(100vw-1rem)] max-h-[calc(100dvh-2rem)] sm:max-w-5xl"
          bodyClassName="max-h-[calc(100dvh-8rem)] overflow-y-auto xl:overflow-hidden"
          headerActions={
            canManage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100"
                onClick={() => setIsEditOpen(true)}
                aria-label="Edit group"
                title="Edit group"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null
          }
        >
          <div className="flex flex-col gap-4 xl:h-[calc(100dvh-12rem)] xl:min-h-0 xl:flex-row">
            <Card className="flex shrink-0 flex-col rounded-2xl border-slate-800 bg-slate-950/45 p-4 xl:w-72">
              <div>
                <p className="text-sm text-slate-400">Your net P/L</p>
                <p className={cn("mt-2 font-mono text-2xl font-semibold", getMoneyTone(group.netPnl))}>
                  {group.netPnl}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
                <div>
                  <p className="text-2xl font-semibold text-slate-100">{memberCount}</p>
                  <p className="text-xs text-slate-500">members</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-emerald-300">{group.activeWagerCount}</p>
                  <p className="text-xs text-slate-500">active wagers</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Description</p>
                <p
                  className={cn(
                    "mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300",
                    !isDescriptionExpanded && "line-clamp-4",
                  )}
                >
                  {description}
                </p>

                {canExpandDescription ? (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((current) => !current)}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    {isDescriptionExpanded ? "Show less" : "Show full description"}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", isDescriptionExpanded && "rotate-180")}
                    />
                  </button>
                ) : null}
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-5">
                <Button type="button" onClick={() => setIsInviteOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Friend
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave Group"}
                </Button>

                {canManage ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Group"}
                  </Button>
                ) : null}
              </div>
            </Card>

            <section className="flex min-w-0 flex-col gap-3 xl:min-h-0 xl:flex-1">
              <div className="flex shrink-0 items-center justify-between text-sm text-slate-400">
                <span>{memberCount} members</span>
                <span>
                  Page {memberPage} / {totalPages}
                </span>
              </div>

              <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2">
                {membersQuery.isLoading ? (
                  <Card className="rounded-2xl border-slate-800 p-4 text-sm text-slate-400">
                    Loading members...
                  </Card>
                ) : membersQuery.isError ? (
                  <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
                    {membersQuery.error instanceof Error ? membersQuery.error.message : "Unable to load members."}
                  </Card>
                ) : (
                  <div className="flex flex-col gap-2">
                    {members.map((member) => (
                      <GroupMemberRow
                        key={member.id}
                        member={member}
                        canRemove={Boolean(canManage && member.id !== user?.id)}
                        isRemoving={removingUserId === member.id}
                        onRemove={(userId) => removeMemberMutation.mutate(userId)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 pb-2">
                <FriendsPagination currentPage={memberPage} totalPages={totalPages} onPageChange={setMemberPage} />
              </div>
            </section>
          </div>
        </FriendsDialogShell>
      </Dialog>

      <InviteGroupMemberDialog groupId={group.id} open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      <EditGroupDialog
        group={group}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onGroupUpdated={onGroupUpdated}
      />
    </>
  );
}
