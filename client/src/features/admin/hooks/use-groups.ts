import { useCallback, useEffect, useState } from "react";
import { paginatedGroupsResponseSchema, type GroupSummary } from "@pb138/shared/schemas/groups";
import { extractApiErrorMessage, readJsonResponse } from "../../../api/http";

const ADMIN_GROUPS_PAGE_SIZE = 10;

export type AdminGroupSummary = Pick<
  GroupSummary,
  "id" | "name" | "description" | "memberCount" | "activeWagerCount"
>;

type Feedback = { type: "success" | "error"; message: string } | null;

type PaginationState = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type GroupActions = {
  deleteGroup: (group: AdminGroupSummary) => Promise<void>;
  refresh: () => Promise<void>;
};

async function fetchAdminGroupsPage(page: number, query: string) {
  const params = new URLSearchParams({
    limit: String(ADMIN_GROUPS_PAGE_SIZE),
    offset: String((page - 1) * ADMIN_GROUPS_PAGE_SIZE),
    q: query,
  });

  const response = await fetch(`/api/admin/groups?${params.toString()}`, {
    credentials: "same-origin",
  });

  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(json, "Unable to load groups"));
  }

  return paginatedGroupsResponseSchema.parse(json);
}

export function useGroups(enabled: boolean, initialPage = 1) {
  const [groups, setGroups] = useState<AdminGroupSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [page, setPageState] = useState(initialPage);
  const [query, setQueryState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setPageState(initialPage);
  }, [initialPage]);

  const fetchGroups = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetchAdminGroupsPage(page, query);
      setGroups(result.data.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: group.memberCount,
        activeWagerCount: group.activeWagerCount,
      })));
      setPagination(result.pagination);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load groups",
      });
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, query]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchGroups();
  }, [enabled, fetchGroups]);

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

  const deleteGroup = useCallback(async (group: AdminGroupSummary) => {
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/groups/${group.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(json, "Unable to delete group"));
      }

      setFeedback({ type: "success", message: `Group '${group.name}' deleted.` });
      await fetchGroups();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete group",
      });
    }
  }, [fetchGroups]);

  return {
    groups,
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
      deleteGroup,
      refresh: fetchGroups,
    },
  };
}
