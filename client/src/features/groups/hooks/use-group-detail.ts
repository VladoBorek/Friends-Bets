import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { deleteGroup, leaveGroup } from "../../../api/groups/groups-api";
import { removeGroupMember } from "../../../api/groups/group-members-api";
import { groupsKeys, groupsQueries } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";

export function useGroupDetail(group: GroupSummary | null, open: boolean, onOpenChange: (open: boolean) => void) {
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
    onMutate: setRemovingUserId,
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
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(groupId),
    onSuccess: async () => {
      toast.success("Group deleted");
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: groupsKeys.all });
    },
  });

  return {
    user,
    memberPage,
    setMemberPage,
    isInviteOpen,
    setIsInviteOpen,
    isEditOpen,
    setIsEditOpen,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    removingUserId,
    canManage,
    membersQuery,
    removeMemberMutation,
    leaveMutation,
    deleteMutation,
  };
}