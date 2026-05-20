import { useCallback, useEffect, useState } from "react";
import { paginatedAdminCategoriesResponseSchema } from "@pb138/shared/schemas/wager";
import { extractApiErrorMessage, readJsonResponse } from "../../../api/http";

const ADMIN_CATEGORIES_PAGE_SIZE = 10;

export type AdminCategorySummary = {
  id: number;
  name: string;
  wagerCount: number;
  betCount: number;
};

type Feedback = { type: "success" | "error"; message: string } | null;

type PaginationState = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

async function fetchAdminCategoriesPage(page: number) {
  const params = new URLSearchParams({
    limit: String(ADMIN_CATEGORIES_PAGE_SIZE),
    offset: String((page - 1) * ADMIN_CATEGORIES_PAGE_SIZE),
  });

  const response = await fetch(`/api/wagers/categories/admin?${params.toString()}`, {
    credentials: "same-origin",
  });

  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(json, "Unable to load categories"));
  }

  return paginatedAdminCategoriesResponseSchema.parse(json);
}

export function useCategories(enabled: boolean) {
  const [categories, setCategories] = useState<AdminCategorySummary[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const fetchCategories = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetchAdminCategoriesPage(page);
      setCategories(result.data);
      setPagination(result.pagination);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load categories",
      });
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchCategories();
  }, [enabled, fetchCategories]);

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  useEffect(() => {
    if (pagination && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pagination, totalPages]);

  const addCategory = useCallback(async () => {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      setFeedback({ type: "error", message: "Category name is required" });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/wagers/categories", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(json, "Unable to add category"));
      }

      setNewCategoryName("");
      setFeedback({ type: "success", message: `Category '${trimmedName}' added.` });
      setPage(1);
      await fetchCategories();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to add category",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCategories, newCategoryName]);

  const removeCategory = useCallback(async (category: AdminCategorySummary) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/wagers/categories/${category.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const json = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(extractApiErrorMessage(json, "Unable to delete category"));
      }

      setFeedback({ type: "success", message: `Category '${category.name}' deleted.` });
      await fetchCategories();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to delete category",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchCategories]);

  return {
    categories,
    feedback,
    isLoading,
    isSubmitting,
    newCategoryName,
    pagination,
    page,
    totalPages,
    setFeedback,
    setNewCategoryName,
    setPage,
    actions: {
      addCategory,
      removeCategory,
      refresh: fetchCategories,
    },
  };
}