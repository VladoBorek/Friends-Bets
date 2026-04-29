import { useCallback, useEffect, useState } from "react";

export type AdminCategorySummary = {
  id: number;
  name: string;
  wagerCount: number;
  betCount: number;
};

type Feedback = { type: "success" | "error"; message: string } | null;

export function useCategories(enabled: boolean) {
  const [categories, setCategories] = useState<AdminCategorySummary[]>([]);
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
      const response = await fetch("/api/wagers/categories/admin");
      const json = (await response.json().catch(() => null)) as
        | { data?: AdminCategorySummary[]; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Unable to load categories");
      }

      setCategories((json?.data ?? []).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load categories",
      });
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void fetchCategories();
  }, [enabled, fetchCategories]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const json = (await response.json().catch(() => null)) as
        | { data?: AdminCategorySummary; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Unable to add category");
      }

      setNewCategoryName("");
      setFeedback({ type: "success", message: `Category '${trimmedName}' added.` });
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
      });
      const json = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Unable to delete category");
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
    setFeedback,
    setNewCategoryName,
    actions: {
      addCategory,
      removeCategory,
      refresh: fetchCategories,
    },
  };
}
