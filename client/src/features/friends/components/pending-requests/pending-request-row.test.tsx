// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PendingRequestRow } from "./pending-request-row";

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    status: "PENDING" as const,
    createdAt: "2024-01-01T00:00:00Z",
    respondedAt: null,
    requester: { id: 10, username: "alice", email: "alice@example.com", roleName: null, createdAt: null },
    addressee: { id: 20, username: "bob", email: "bob@example.com", roleName: null, createdAt: null },
    ...overrides,
  };
}

const defaultProps = {
  request: makeRequest(),
  type: "incoming" as const,
  isAccepting: false,
  isRejecting: false,
  onAccept: vi.fn(),
  onReject: vi.fn(),
};

describe("PendingRequestRow", () => {
  describe("incoming tab", () => {
    it('shows "Accept" and "Reject" buttons', () => {
      render(<PendingRequestRow {...defaultProps} type="incoming" />);
      expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    });

    it("shows the requester's username and email", () => {
      render(<PendingRequestRow {...defaultProps} type="incoming" />);
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    it('shows "Accepting..." and disables both buttons while isAccepting is true', () => {
      render(<PendingRequestRow {...defaultProps} type="incoming" isAccepting={true} />);
      expect(screen.getByRole("button", { name: "Accepting..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
    });

    it('shows "Rejecting..." and disables both buttons while isRejecting is true', () => {
      render(<PendingRequestRow {...defaultProps} type="incoming" isRejecting={true} />);
      expect(screen.getByRole("button", { name: "Rejecting..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Accept" })).toBeDisabled();
    });

    it("calls onAccept when Accept is clicked", () => {
      const onAccept = vi.fn();
      render(<PendingRequestRow {...defaultProps} type="incoming" onAccept={onAccept} />);
      fireEvent.click(screen.getByRole("button", { name: "Accept" }));
      expect(onAccept).toHaveBeenCalledOnce();
    });

    it("calls onReject when Reject is clicked", () => {
      const onReject = vi.fn();
      render(<PendingRequestRow {...defaultProps} type="incoming" onReject={onReject} />);
      fireEvent.click(screen.getByRole("button", { name: "Reject" }));
      expect(onReject).toHaveBeenCalledOnce();
    });
  });

  describe("outgoing tab", () => {
    it('shows a disabled "Cancel soon" button', () => {
      render(<PendingRequestRow {...defaultProps} type="outgoing" />);
      expect(screen.getByRole("button", { name: "Cancel soon" })).toBeDisabled();
    });

    it("does not show Accept or Reject buttons", () => {
      render(<PendingRequestRow {...defaultProps} type="outgoing" />);
      expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    });

    it("shows the addressee's username and email", () => {
      render(<PendingRequestRow {...defaultProps} type="outgoing" />);
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });
  });
});
