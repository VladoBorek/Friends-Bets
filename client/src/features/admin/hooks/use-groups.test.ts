// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useGroups } from "./use-groups";
import type { Mock } from "vitest";

interface MockResponse {
  ok: boolean;
  text: () => Promise<string>;
  headers: Map<string, string>;
}

describe("useGroups", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockGroupsResponse = {
    data: [
      {
        id: 1,
        name: "Test Group",
        description: "Test Description",
        memberCount: 5,
        activeWagerCount: 2,
        inviteCode: "ABCDEF",
        currentUserRole: "OWNER",
        netPnl: "100.00",
        topMembers: [],
        createdAt: new Date().toISOString(),
      },
    ],
    pagination: {
      total: 25,
      limit: 10,
      offset: 0,
      hasMore: true,
    },
  };

  const createMockResponse = (data: unknown, ok = true): MockResponse => ({
    ok,
    text: async () => JSON.stringify(data),
    headers: new Map(),
  });

  it("does not fetch if not enabled", () => {
    const { result } = renderHook(() => useGroups(false));
    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches groups when enabled", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse(mockGroupsResponse));

    const { result } = renderHook(() => useGroups(true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.groups.length).toBeGreaterThan(0);
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].name).toBe("Test Group");
  });

  it("handles search query updates", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse(mockGroupsResponse));

    const { result } = renderHook(() => useGroups(true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setQuery("new query");
    });

    expect(result.current.query).toBe("new query");
    expect(result.current.page).toBe(1); // Should reset to page 1
  });

  it("handles delete group action", async () => {
    (fetch as Mock).mockResolvedValueOnce(createMockResponse(mockGroupsResponse));

    const { result } = renderHook(() => useGroups(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    (fetch as Mock).mockResolvedValueOnce(createMockResponse({}));
    
    // For refresh
    (fetch as Mock).mockResolvedValueOnce(createMockResponse(mockGroupsResponse));

    await act(async () => {
      await result.current.actions.deleteGroup(result.current.groups[0]);
    });

    expect(result.current.feedback?.type).toBe("success");
    expect(result.current.feedback?.message).toContain("deleted");
  });
});
