// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCategories } from "@client/features/admin/hooks/use-categories";
import type { Mock } from "vitest";

interface MockResponse {
  ok: boolean;
  text: () => Promise<string>;
  headers: Map<string, string>;
}

describe("useCategories", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockCategoriesResponse = {
    data: [
      {
        id: 1,
        name: "Sports",
        wagerCount: 5,
        betCount: 10,
      },
    ],
    pagination: {
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    },
  };

  const createMockResponse = (data: unknown, ok = true): MockResponse => ({
    ok,
    text: async () => JSON.stringify(data),
    headers: new Map(),
  });

  it("does not fetch if not enabled", () => {
    const { result } = renderHook(() => useCategories(false));
    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches categories when enabled", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse(mockCategoriesResponse));

    const { result } = renderHook(() => useCategories(true));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toHaveLength(1);
    expect(result.current.categories[0].name).toBe("Sports");
  });

  it("handles add category action", async () => {
    (fetch as Mock).mockResolvedValueOnce(createMockResponse(mockCategoriesResponse));

    const { result } = renderHook(() => useCategories(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setNewCategoryName("Games");
    });

    (fetch as Mock).mockResolvedValueOnce(createMockResponse({ id: 2, name: "Games" }));
    
    // For refresh
    (fetch as Mock).mockResolvedValueOnce(createMockResponse(mockCategoriesResponse));

    await act(async () => {
      await result.current.actions.addCategory();
    });

    expect(result.current.feedback?.type).toBe("success");
    expect(result.current.newCategoryName).toBe("");
  });

  it("handles remove category action", async () => {
    (fetch as Mock).mockResolvedValueOnce(createMockResponse(mockCategoriesResponse));

    const { result } = renderHook(() => useCategories(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (fetch as Mock).mockResolvedValueOnce(createMockResponse({}));
    
    // For refresh
    (fetch as Mock).mockResolvedValueOnce(createMockResponse(mockCategoriesResponse));

    await act(async () => {
      await result.current.actions.removeCategory(result.current.categories[0]);
    });

    expect(result.current.feedback?.type).toBe("success");
    expect(result.current.feedback?.message).toContain("deleted");
  });
});
