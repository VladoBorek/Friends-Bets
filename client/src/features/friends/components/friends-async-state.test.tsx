// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FriendsAsyncState } from "./friends-async-state";

const defaultProps = {
  isLoading: false,
  error: null,
  isEmpty: false,
  emptyMessage: "No friends yet.",
  children: <p>friends list</p>,
};

describe("FriendsAsyncState", () => {
  describe("loading state", () => {
    it("renders skeleton placeholders instead of children", () => {
      const { container } = render(<FriendsAsyncState {...defaultProps} isLoading={true} />);
      expect(screen.queryByText("friends list")).not.toBeInTheDocument();
      expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);
    });

    it("renders the number of skeletons specified by skeletonCount", () => {
      const { container } = render(
        <FriendsAsyncState {...defaultProps} isLoading={true} skeletonCount={2} />,
      );
      expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);
    });
  });

  describe("error state", () => {
    it("shows the Error message when error is an Error instance", () => {
      render(<FriendsAsyncState {...defaultProps} error={new Error("Network failure")} />);
      expect(screen.getByText("Network failure")).toBeInTheDocument();
    });

    it("shows the default error message for non-Error values", () => {
      render(<FriendsAsyncState {...defaultProps} error="something bad" />);
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });

    it("shows a custom errorMessage for non-Error values when provided", () => {
      render(
        <FriendsAsyncState {...defaultProps} error="bad" errorMessage="Custom error text" />,
      );
      expect(screen.getByText("Custom error text")).toBeInTheDocument();
    });

    it("does not render children in the error state", () => {
      render(<FriendsAsyncState {...defaultProps} error={new Error("oops")} />);
      expect(screen.queryByText("friends list")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows the emptyMessage when isEmpty is true", () => {
      render(<FriendsAsyncState {...defaultProps} isEmpty={true} />);
      expect(screen.getByText("No friends yet.")).toBeInTheDocument();
    });

    it("does not render children when isEmpty is true", () => {
      render(<FriendsAsyncState {...defaultProps} isEmpty={true} />);
      expect(screen.queryByText("friends list")).not.toBeInTheDocument();
    });
  });

  describe("normal state", () => {
    it("renders children when not loading, not errored, and not empty", () => {
      render(<FriendsAsyncState {...defaultProps} />);
      expect(screen.getByText("friends list")).toBeInTheDocument();
    });
  });
});
