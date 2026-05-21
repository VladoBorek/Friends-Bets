import { useCallback, useEffect, useState } from "react";
import { paginatedGroupMembersResponseSchema, type GroupMemberSummary } from "@pb138/shared/schemas/groups";
import { extractApiErrorMessage, readJsonResponse } from "../../../api/http";

const ADMIN_GROUP_MEMBERS_PAGE_SIZE = 10;

type Feedback = { type: "success" | "error"; message: string } | null;

type PaginationState = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export function useGroupMembers(groupId: number) {
  const [members, setMembers] = useState<GroupMemberSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [page, setPageState] = useState(1);
  const [query, setQueryState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        limit: String(ADMIN_GROUP_MEMBERS_PAGE_SIZE),
        offset: String((page - 1) * ADMIN_GROUP_MEMBERS_PAGE_SIZE),
        q: query,
      });

      const response = await fetch(`/api/admin/groups/${groupId}/members?${params.toString()}`, {
        credentials: "same-origin",
      });

      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(json, "Unable to load members"));
      }

      const result = paginatedGroupMembersResponseSchema.parse(json);
      setMembers(result.data);
      setPagination(result.pagination);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load members",
      });
    } finally {
      setIsLoading(false);
    }
  }, [groupId, page, query]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  useEffect(() => {
    if (pagination && page > totalPages) {
      setPageState(totalPages);
    }
  }, [page, pagination, totalPages]);

  const setQuery = (nextQuery: string) => {
    setQueryState(nextQuery);
    setPageState(1);
  };

  const removeMember = useCallback(
    async (userId: number, newOwnerId?: number) => {
      setFeedback(null);

      const body = newOwnerId ? { newOwnerId } : undefined;

      const response = await fetch(`/api/admin/groups/${groupId}/members/${userId}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(json, "Unable to remove member"));
      }

      await fetchMembers();
    },
    [fetchMembers, groupId],
  );

  const changeOwner = useCallback(
    async (newOwnerId: number) => {
      setFeedback(null);

      const response = await fetch(`/api/admin/groups/${groupId}/owner`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId }),
      });

      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(json, "Unable to change owner"));
      }

      await fetchMembers();
    },
    [fetchMembers, groupId],
  );

  return {
    members,
    feedback,
    isLoading,
    pagination,
    page,
    totalPages,
    query,
    setFeedback,
    setQuery,
    setPage: setPageState,
    actions: {
      removeMember,
      changeOwner,
      refresh: fetchMembers,
    },
  };
}
