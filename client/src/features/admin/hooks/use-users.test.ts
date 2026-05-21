// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUsers } from "./use-users";
import type { Mock } from "vitest";

interface MockResponse {
  ok: boolean;
  text: () => Promise<string>;
  headers: Map<string, string>;
}

describe("useUsers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUsersResponse = {
    data: [
      {
        id: 1,
        username: "adminuser",
        email: "admin@example.com",
        roleName: "ADMIN",
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      },
      {
        id: 2,
        username: "testuser",
        email: "test@example.com",
        roleName: "USER",
        isVerified: true,
        createdAt: new Date().toISOString(),
        suspendedUntil: null,
      },
    ],
    pagination: {
      total: 2,
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

  it("fetches and sorts users on mount", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse(mockUsersResponse));

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.users.length).toBeGreaterThan(0);
    }, { timeout: 2000 });

    // Admins should be first due to sortUsers
    expect(result.current.users[0].username).toBe("adminuser");
    expect(result.current.users[1].username).toBe("testuser");
    expect(result.current.stats.total).toBe(2);
    expect(result.current.stats.admins).toBe(1);
  });

  it("handles fetch error", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse({ message: "API Error" }, false));

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.feedback?.type).toBe("error");
    expect(result.current.feedback?.message).toBe("API Error");
  });

  it("filters users locally based on query", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse(mockUsersResponse));

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setQuery("testuser");
    });

    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].username).toBe("testuser");
  });

  it("synchronizes with initialPage parameter", async () => {
    (fetch as Mock).mockResolvedValue(createMockResponse({
      ...mockUsersResponse,
      pagination: { ...mockUsersResponse.pagination, total: 25 }
    }));

    const { result, rerender } = renderHook(({ p }) => useUsers(p), {
      initialProps: { p: 1 }
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.page).toBe(1);

    rerender({ p: 2 });
    expect(result.current.page).toBe(2);
  });
});
