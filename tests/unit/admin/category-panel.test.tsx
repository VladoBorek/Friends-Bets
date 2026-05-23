// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryPanel } from "@client/features/admin/components/category-panel";
import type { AdminCategorySummary } from "@client/features/admin/hooks/use-categories";

// Mock FriendsPagination
vi.mock("@client/features/friends/components/friends-pagination", () => ({
  FriendsPagination: ({ onPageChange }: { onPageChange: (p: number) => void }) => (
    <button onClick={() => onPageChange(2)} data-testid="mock-pagination">
      Next Page
    </button>
  ),
}));

const mockCategories: AdminCategorySummary[] = [
  {
    id: 1,
    name: "Sports",
    wagerCount: 10,
    betCount: 50,
  },
  {
    id: 2,
    name: "Empty Category",
    wagerCount: 0,
    betCount: 0,
  },
];

const mockPagination = {
  total: 2,
  limit: 10,
  offset: 0,
  hasMore: false,
};

describe("CategoryPanel", () => {
  const defaultProps = {
    categories: mockCategories,
    isLoading: false,
    isSubmitting: false,
    newCategoryName: "",
    pagination: mockPagination,
    currentPage: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    onCategoryNameChange: vi.fn(),
    onAddCategory: vi.fn(),
    onDeleteCategory: vi.fn(),
  };

  it("renders the table headers", () => {
    render(<CategoryPanel {...defaultProps} />);
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Wagers")).toBeInTheDocument();
    expect(screen.getByText("Bets")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("renders the list of categories", () => {
    render(<CategoryPanel {...defaultProps} />);
    expect(screen.getByText("Sports")).toBeInTheDocument();
    expect(screen.getByText("Empty Category")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("calls onCategoryNameChange when typing in the add category input", () => {
    render(<CategoryPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText(/e.g. Sports/i);
    fireEvent.change(input, { target: { value: "Games" } });
    expect(defaultProps.onCategoryNameChange).toHaveBeenCalledWith("Games");
  });

  it("calls onAddCategory when clicking the add button", () => {
    render(<CategoryPanel {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Add Category/i }));
    expect(defaultProps.onAddCategory).toHaveBeenCalled();
  });

  it("calls onDeleteCategory when the delete button is clicked", () => {
    render(<CategoryPanel {...defaultProps} />);
    // Only the second category can be deleted (wagerCount === 0 and betCount === 0)
    const deleteButtons = screen.getAllByRole("button").filter(b => b.querySelector('svg'));
    fireEvent.click(deleteButtons[1]);
    expect(defaultProps.onDeleteCategory).toHaveBeenCalledWith(mockCategories[1]);
  });

  it("disables the delete button if category has wagers or bets", () => {
    render(<CategoryPanel {...defaultProps} />);
    const deleteButtons = screen.getAllByRole("button").filter(b => b.querySelector('svg'));
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).not.toBeDisabled();
  });

  it("shows loading state", () => {
    render(<CategoryPanel {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Loading categories.../i)).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<CategoryPanel {...defaultProps} categories={[]} />);
    expect(screen.getByText(/No categories found./i)).toBeInTheDocument();
  });
});
