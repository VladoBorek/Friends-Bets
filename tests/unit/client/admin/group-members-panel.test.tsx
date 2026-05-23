// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupMembersPanel } from "@client/features/admin/components/group-members-panel";

// Mock FriendsPagination
vi.mock("@client/features/friends/components/friends-pagination", () => ({
  FriendsPagination: ({ onPageChange }: { onPageChange: (p: number) => void }) => (
    <button onClick={() => onPageChange(2)} data-testid="mock-pagination">
      Next Page
    </button>
  ),
}));

// Mock GroupMemberActionMenu
vi.mock("@client/features/admin/components/group-member-action-menu", () => ({
  GroupMemberActionMenu: () => <div data-testid="member-action-menu" />,
}));

// Mock useGroupMembers hook
vi.mock("@client/features/admin/hooks/use-group-members", () => ({
  useGroupMembers: () => ({
    members: [
      {
        id: 1,
        username: "owneruser",
        email: "owner@example.com",
        groupRole: "OWNER",
        joinedAt: new Date().toISOString(),
      },
      {
        id: 2,
        username: "memberuser",
        email: "member@example.com",
        groupRole: "MEMBER",
        joinedAt: new Date().toISOString(),
      },
    ],
    isLoading: false,
    query: "",
    setQuery: vi.fn(),
    page: 1,
    setPage: vi.fn(),
    totalPages: 1,
    pagination: { total: 2, limit: 10, offset: 0, hasMore: false },
    actions: {
      removeMember: vi.fn(),
      changeOwner: vi.fn(),
    },
  }),
}));

describe("GroupMembersPanel", () => {
  const defaultProps = {
    groupId: 1,
    groupName: "Test Group",
    onBack: vi.fn(),
  };

  it("renders the header with group name", () => {
    render(<GroupMembersPanel {...defaultProps} />);
    expect(screen.getByText(/Members of Test Group/i)).toBeInTheDocument();
  });

  it("renders the list of members", () => {
    render(<GroupMembersPanel {...defaultProps} />);
    expect(screen.getByText("owneruser")).toBeInTheDocument();
    expect(screen.getByText("memberuser")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    // Use getAllByText for "Member" because it's both in the header and the badge
    expect(screen.getAllByText("Member")).toHaveLength(2);
  });

  it("calls onBack when the back button is clicked", () => {
    render(<GroupMembersPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Back to groups list/i }));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it("shows the member action menu", () => {
    render(<GroupMembersPanel {...defaultProps} />);
    expect(screen.getAllByTestId("member-action-menu")).toHaveLength(2);
  });
});
