// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddFriendRow } from "@client/features/friends/components/add-friend/add-friend-row";

function makeCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    username: "johndoe",
    email: "john@example.com",
    roleName: null,
    createdAt: null,
    relationshipState: "AVAILABLE" as const,
    friendshipId: null,
    ...overrides,
  };
}

describe("AddFriendRow", () => {
  describe("button label", () => {
    it('shows "Add" when state is AVAILABLE and not sending', () => {
      render(<AddFriendRow candidate={makeCandidate()} isSending={false} onSendRequest={vi.fn()} />);
      expect(screen.getByRole("button", { name: /^add$/i })).toBeInTheDocument();
    });

    it('shows "Friends" when state is FRIENDS', () => {
      render(
        <AddFriendRow
          candidate={makeCandidate({ relationshipState: "FRIENDS" })}
          isSending={false}
          onSendRequest={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Friends" })).toBeInTheDocument();
    });

    it('shows "Request sent" when state is OUTGOING_PENDING', () => {
      render(
        <AddFriendRow
          candidate={makeCandidate({ relationshipState: "OUTGOING_PENDING" })}
          isSending={false}
          onSendRequest={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Request sent" })).toBeInTheDocument();
    });

    it('shows "Request sent" when state is INCOMING_PENDING', () => {
      render(
        <AddFriendRow
          candidate={makeCandidate({ relationshipState: "INCOMING_PENDING" })}
          isSending={false}
          onSendRequest={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Request sent" })).toBeInTheDocument();
    });

    it('shows "Sending..." when isSending is true', () => {
      render(<AddFriendRow candidate={makeCandidate()} isSending={true} onSendRequest={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Sending..." })).toBeInTheDocument();
    });
  });

  describe("button disabled state", () => {
    it("is enabled when state is AVAILABLE and not sending", () => {
      render(<AddFriendRow candidate={makeCandidate()} isSending={false} onSendRequest={vi.fn()} />);
      expect(screen.getByRole("button", { name: /^add$/i })).not.toBeDisabled();
    });

    it("is disabled when state is FRIENDS", () => {
      render(
        <AddFriendRow
          candidate={makeCandidate({ relationshipState: "FRIENDS" })}
          isSending={false}
          onSendRequest={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Friends" })).toBeDisabled();
    });

    it("is disabled when state is OUTGOING_PENDING", () => {
      render(
        <AddFriendRow
          candidate={makeCandidate({ relationshipState: "OUTGOING_PENDING" })}
          isSending={false}
          onSendRequest={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Request sent" })).toBeDisabled();
    });

    it("is disabled while isSending is true", () => {
      render(<AddFriendRow candidate={makeCandidate()} isSending={true} onSendRequest={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("calls onSendRequest with the candidate id when Add is clicked", () => {
      const onSendRequest = vi.fn();
      render(<AddFriendRow candidate={makeCandidate({ id: 42 })} isSending={false} onSendRequest={onSendRequest} />);
      fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
      expect(onSendRequest).toHaveBeenCalledWith(42);
    });

    it("does not call onSendRequest when button is disabled", () => {
      const onSendRequest = vi.fn();
      render(
        <AddFriendRow
          candidate={makeCandidate({ relationshipState: "FRIENDS" })}
          isSending={false}
          onSendRequest={onSendRequest}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Friends" }));
      expect(onSendRequest).not.toHaveBeenCalled();
    });
  });

  describe("person info", () => {
    it("renders the candidate username and email", () => {
      render(<AddFriendRow candidate={makeCandidate()} isSending={false} onSendRequest={vi.fn()} />);
      expect(screen.getByText("johndoe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });
});
