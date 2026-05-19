import { describe, it, expect } from "vitest";
import { buildButtonLabel, filterUsers, getRelationshipState } from "./add-friend-dialog-utils";

describe("buildButtonLabel", () => {
  it('returns "Sending..." when isSending is true, regardless of state', () => {
    expect(buildButtonLabel("AVAILABLE", true)).toBe("Sending...");
    expect(buildButtonLabel("FRIENDS", true)).toBe("Sending...");
  });

  it('returns "Friends" for FRIENDS state when not sending', () => {
    expect(buildButtonLabel("FRIENDS", false)).toBe("Friends");
  });

  it('returns "Request sent" for OUTGOING_PENDING when not sending', () => {
    expect(buildButtonLabel("OUTGOING_PENDING", false)).toBe("Request sent");
  });

  it('returns "Request sent" for INCOMING_PENDING when not sending', () => {
    expect(buildButtonLabel("INCOMING_PENDING", false)).toBe("Request sent");
  });

  it('returns "Add" for AVAILABLE when not sending', () => {
    expect(buildButtonLabel("AVAILABLE", false)).toBe("Add");
  });
});

describe("filterUsers", () => {
  function makeUser(id: number, username: string, email: string) {
    return { id, username, email, roleName: null, createdAt: null, relationshipState: "AVAILABLE" as const, friendshipId: null };
  }

  const users = [
    makeUser(1, "alice", "alice@example.com"),
    makeUser(2, "bob", "bob@example.com"),
    makeUser(3, "charlie", "charlie@other.org"),
  ];

  it("returns all users when query is empty", () => {
    expect(filterUsers(users, "")).toHaveLength(3);
  });

  it("returns all users when query is only whitespace", () => {
    expect(filterUsers(users, "   ")).toHaveLength(3);
  });

  it("filters by username, case-insensitive", () => {
    expect(filterUsers(users, "ALI")).toEqual([users[0]]);
  });

  it("filters by email, case-insensitive", () => {
    expect(filterUsers(users, "OTHER")).toEqual([users[2]]);
  });

  it("returns an empty array when no users match", () => {
    expect(filterUsers(users, "xyz")).toHaveLength(0);
  });

  it("returns multiple users when the query matches several", () => {
    expect(filterUsers(users, "example.com")).toHaveLength(2);
  });
});

describe("getRelationshipState", () => {
  it('returns "friends" when candidateId is in friendIds', () => {
    expect(getRelationshipState(5, [1, 5, 9], [])).toBe("friends");
  });

  it('returns "request-sent" when candidateId is in pendingIds', () => {
    expect(getRelationshipState(3, [], [3, 7])).toBe("request-sent");
  });

  it('returns "add" when candidateId is in neither list', () => {
    expect(getRelationshipState(99, [1, 2], [3, 4])).toBe("add");
  });

  it('friendIds takes priority over pendingIds when both contain the id', () => {
    expect(getRelationshipState(5, [5], [5])).toBe("friends");
  });
});
