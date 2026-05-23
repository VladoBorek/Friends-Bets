// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WagerPagination } from "@client/features/wagers/components/wager-pagination";

describe("WagerPagination", () => {
  describe("visibility", () => {
    it("renders nothing when totalPages is 1", () => {
      const { container } = render(
        <WagerPagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when totalPages is 0", () => {
      const { container } = render(
        <WagerPagination currentPage={1} totalPages={0} onPageChange={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders when totalPages is greater than 1", () => {
      const { container } = render(
        <WagerPagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />,
      );
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe("page numbers", () => {
    it("shows all page numbers when totalPages is 5 or fewer", () => {
      render(<WagerPagination currentPage={1} totalPages={4} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    });

    it("hides middle pages and shows an ellipsis for large page counts", () => {
      render(<WagerPagination currentPage={1} totalPages={10} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();
    });

    it("marks the current page with aria-current", () => {
      render(<WagerPagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    });

    it("does not mark non-current pages with aria-current", () => {
      render(<WagerPagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
    });
  });

  describe("Previous and Next buttons", () => {
    it("disables Previous on the first page", () => {
      render(<WagerPagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });

    it("enables Previous when not on the first page", () => {
      render(<WagerPagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    });

    it("disables Next on the last page", () => {
      render(<WagerPagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("enables Next when not on the last page", () => {
      render(<WagerPagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("calls onPageChange with the clicked page number", () => {
      const onPageChange = vi.fn();
      render(<WagerPagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
      fireEvent.click(screen.getByRole("button", { name: "3" }));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("does not call onPageChange when the current page is clicked", () => {
      const onPageChange = vi.fn();
      render(<WagerPagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
      fireEvent.click(screen.getByRole("button", { name: "2" }));
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("calls onPageChange with currentPage - 1 when Previous is clicked", () => {
      const onPageChange = vi.fn();
      render(<WagerPagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Previous" }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("calls onPageChange with currentPage + 1 when Next is clicked", () => {
      const onPageChange = vi.fn();
      render(<WagerPagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });
  });
});
