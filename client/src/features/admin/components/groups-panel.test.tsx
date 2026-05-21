// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupsPanel } from "./groups-panel";
import type { AdminGroupSummary } from "../hooks/use-groups";

// Mock FriendsPagination
vi.mock("../../friends/components/friends-pagination", () => ({
  FriendsPagination: ({ onPageChange }: { onPageChange: (p: number) => void }) => (
    <button onClick={() => onPageChange(2)} data-testid="mock-pagination">
      Next Page
    </button>
  ),
}));

const mockGroups: AdminGroupSummary[] = [
  {
    id: 1,
    name: "Test Group 1",
    description: "Description 1",
    memberCount: 5,
    activeWagerCount: 2,
  },
  {
    id: 2,
    name: "Empty Group",
    description: null,
    memberCount: 1,
    activeWagerCount: 0,
  },
];

const mockPagination = {
  total: 2,
  limit: 10,
  offset: 0,
  hasMore: false,
};

describe("GroupsPanel", () => {
  const defaultProps = {
    groups: mockGroups,
    isLoading: false,
    query: "",
    pagination: mockPagination,
    currentPage: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    onQueryChange: vi.fn(),
    onSelectGroup: vi.fn(),
    actions: {
      deleteGroup: vi.fn(),
      refresh: vi.fn(),
    },
  };

  it("renders the table headers", () => {
    render(<GroupsPanel {...defaultProps} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Active Wagers")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders the list of groups", () => {
    render(<GroupsPanel {...defaultProps} />);
    expect(screen.getByText("Test Group 1")).toBeInTheDocument();
    expect(screen.getByText("Description 1")).toBeInTheDocument();
    expect(screen.getByText("Empty Group")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onSelectGroup when a row is clicked", () => {
    render(<GroupsPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Test Group 1"));
    expect(defaultProps.onSelectGroup).toHaveBeenCalledWith(mockGroups[0]);
  });

  it("calls deleteGroup when the delete button is clicked", () => {
    render(<GroupsPanel {...defaultProps} />);
    // Only the second group can be deleted (activeWagerCount === 0)
    const deleteButtons = screen.getAllByRole("button", { name: /Delete group/i });
    fireEvent.click(deleteButtons[1]);
    expect(defaultProps.actions.deleteGroup).toHaveBeenCalledWith(mockGroups[1]);
  });

  it("disables the delete button if active wagers > 0", () => {
    render(<GroupsPanel {...defaultProps} />);
    const deleteButtons = screen.getAllByRole("button", { name: /Delete group/i });
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).not.toBeDisabled();
  });

  it("calls onQueryChange when searching", () => {
    render(<GroupsPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search groups by name.../i);
    fireEvent.change(input, { target: { value: "test" } });
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith("test");
  });

  it("shows loading state", () => {
    render(<GroupsPanel {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Loading groups.../i)).toBeInTheDocument();
  });
});
