// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserTable } from "@client/features/admin/components/user-table";
import type { UserSummary } from "@pb138/shared/schemas/user";
import type { UserActions } from "@client/features/admin/hooks/use-users";

// Mock child components to keep this a unit test of UserTable
vi.mock("@client/features/admin/components/user-action-menu", () => ({
  UserActionMenu: () => <div data-testid="user-action-menu" />,
}));

vi.mock("@client/features/friends/components/friends-pagination", () => ({
  FriendsPagination: ({ onPageChange }: { onPageChange: (p: number) => void }) => (
    <button onClick={() => onPageChange(2)} data-testid="mock-pagination">
      Next Page
    </button>
  ),
}));

const mockUsers: UserSummary[] = [
  {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    roleName: "USER",
    isVerified: true,
    createdAt: new Date().toISOString(),
    suspendedUntil: null,
  },
  {
    id: 2,
    username: "adminuser",
    email: "admin@example.com",
    roleName: "ADMIN",
    isVerified: true,
    createdAt: new Date().toISOString(),
    suspendedUntil: null,
  },
  {
    id: 3,
    username: "suspendeduser",
    email: "suspended@example.com",
    roleName: "USER",
    isVerified: true,
    createdAt: new Date().toISOString(),
    suspendedUntil: new Date(Date.now() + 100000).toISOString(),
  },
];

const mockPagination = {
  total: 3,
  limit: 10,
  offset: 0,
  hasMore: false,
};

describe("UserTable", () => {
  const defaultProps = {
    users: mockUsers,
    isLoading: false,
    query: "",
    pagination: mockPagination,
    currentPage: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    onQueryChange: vi.fn(),
    actions: {} as UserActions,
  };

  it("renders the table headers correctly", () => {
    render(<UserTable {...defaultProps} />);
    expect(screen.getByText("User ID")).toBeInTheDocument();
    expect(screen.getByText("Identity")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders the list of users", () => {
    render(<UserTable {...defaultProps} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("adminuser")).toBeInTheDocument();
    expect(screen.getByText("suspendeduser")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("suspended@example.com")).toBeInTheDocument();
  });

  it("shows the correct status badges", () => {
    render(<UserTable {...defaultProps} />);
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders non-verified status correctly", () => {
    const nonVerifiedUser: UserSummary = {
      ...mockUsers[0],
      isVerified: false,
    };
    render(<UserTable {...defaultProps} users={[nonVerifiedUser]} />);
    expect(screen.getByText("Non-Verified")).toBeInTheDocument();
  });

  it("calls onQueryChange when typing in the search box", () => {
    render(<UserTable {...defaultProps} />);
    const input = screen.getByPlaceholderText(/select user, role, email.../i);
    fireEvent.change(input, { target: { value: "admin" } });
    expect(defaultProps.onQueryChange).toHaveBeenCalledWith("admin");
  });

  it("calls onPageChange when pagination is used", () => {
    render(<UserTable {...defaultProps} totalPages={2} />);
    fireEvent.click(screen.getByTestId("mock-pagination"));
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2);
  });

  it("shows loading state", () => {
    render(<UserTable {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Loading system users.../i)).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<UserTable {...defaultProps} users={[]} />);
    expect(screen.getByText(/No matching users found./i)).toBeInTheDocument();
  });
});
