// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FriendPersonCell } from "@client/features/friends/components/dialog/friends-person-cell";

describe("FriendPersonCell", () => {
  describe("content", () => {
    it("renders the username", () => {
      render(<FriendPersonCell username="johndoe" email="john@example.com" />);
      expect(screen.getByText("johndoe")).toBeInTheDocument();
    });

    it("renders the email", () => {
      render(<FriendPersonCell username="johndoe" email="john@example.com" />);
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  describe("avatar initials", () => {
    it("shows the uppercased first letter of a single-word username", () => {
      render(<FriendPersonCell username="alice" email="a@example.com" />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("shows the first letters of the first two words for a multi-word username", () => {
      render(<FriendPersonCell username="John Doe" email="j@example.com" />);
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("uppercases both initials even when username is lowercase", () => {
      render(<FriendPersonCell username="alice smith" email="a@example.com" />);
      expect(screen.getByText("AS")).toBeInTheDocument();
    });

    it("uses only the first two words when username has more", () => {
      render(<FriendPersonCell username="one two three" email="a@example.com" />);
      expect(screen.getByText("OT")).toBeInTheDocument();
    });
  });
});
