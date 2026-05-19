import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { fetchGroupInvitationCount } from "../../../api/groups/group-invitations-api";
import { groupsQueries } from "../../../api/groups/groups-query-options";
import { Route } from "../../../routes/groups";
import { useAuth } from "../../../lib/auth-context";

export function useGroupsPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [selectedGroup, setSelectedGroup] = useState<GroupSummary | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);

  const groupsQuery = useQuery({
    ...groupsQueries.list(search.page),
    placeholderData: keepPreviousData,
  });

  const incomingInvitesQuery = useQuery({
    queryKey: ["group-invitations-count", user?.id, "incoming"],
    queryFn: () => fetchGroupInvitationCount("incoming"),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const groups = useMemo(() => groupsQuery.data?.data ?? [], [groupsQuery.data?.data]);
  const pagination = groupsQuery.data?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const handlePageChange = (page: number) => {
    void navigate({ to: "/groups", search: { page }, resetScroll: false });
  };

  return {
    search,
    groupsQuery,
    groups,
    pagination,
    totalPages,
    selectedGroup,
    setSelectedGroup,
    isCreateOpen,
    setIsCreateOpen,
    isPendingDialogOpen,
    setIsPendingDialogOpen,
    hasIncomingInvites: (incomingInvitesQuery.data ?? 0) > 0,
    handlePageChange,
  };
}