import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { deleteGroup, leaveGroup } from "../../../api/groups/groups-api";
import { removeGroupMember } from "../../../api/groups/group-members-api";
import { groupsKeys, groupsQueries } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import { Button } from "../button";
import { Card } from "../card";
import { Dialog } from "../dialog";
import { FriendsDialogShell } from "../friends/dialog/friends-dialog-shell";
import { FriendsPagination } from "../friends/friends-pagination";
import { GroupMemberRow } from "./group-member-row";
import { InviteGroupMemberDialog } from "./invite-group-member-dialog";

type GroupDetailDialogProps = {
  group: GroupSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GroupDetailDialog({ group, open, onOpenChange }: GroupDetailDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [memberPage, setMemberPage] = useState(1);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
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
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <FriendsDialogShell
          title={group.name}
          contentClassName="sm:max-w-5xl"
          bodyClassName="max-h-[calc(85vh-88px)] overflow-y-auto"
        >
          <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <Card className="rounded-2xl border-slate-800 bg-slate-950/45 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-semibold text-slate-100">{group.memberCount}</p>
                  <p className="text-xs text-slate-500">members</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-emerald-300">{group.activeWagerCount}</p>
                  <p className="text-xs text-slate-500">active wagers</p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-800 pt-5">
                <p className="text-sm text-slate-400">Your net P/L</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-slate-100">{group.netPnl}</p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
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

            <section className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>{pagination?.total ?? group.memberCount} members</span>
                <span>
                  Page {memberPage} / {totalPages}
                </span>
              </div>

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

              <FriendsPagination currentPage={memberPage} totalPages={totalPages} onPageChange={setMemberPage} />
            </section>
          </div>
        </FriendsDialogShell>
      </Dialog>

      <InviteGroupMemberDialog groupId={group.id} open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </>
  );
}