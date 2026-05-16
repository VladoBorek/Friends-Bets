import type { GroupMemberSummary, GroupRole, GroupSummary } from "@pb138/shared/schemas/groups";
import type { GroupMemberRow } from "../../../repositories/group/group-member-repository";
import type { GroupRow } from "../../../repositories/group/group-repository";

function normalizeGroupRole(role: string): GroupRole {
  return role === "OWNER" ? "OWNER" : "MEMBER";
}

function normalizeUserRole(roleName: unknown): string {
  return typeof roleName === "string" && roleName.trim().length > 0
    ? roleName.toUpperCase()
    : "USER";
}

export function mapGroupSummary(row: GroupRow): GroupSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    inviteCode: row.inviteCode,
    currentUserRole: normalizeGroupRole(row.currentUserRole),
    memberCount: row.memberCount,
    activeWagerCount: row.activeWagerCount,
    netPnl: formatSignedMoney(row.netPnl),
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}

export function mapGroupMemberSummary(row: GroupMemberRow): GroupMemberSummary {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    roleName: normalizeUserRole(row.roleName),
    isVerified: row.isVerified ?? false,
    suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
    membershipId: row.membershipId,
    groupRole: normalizeGroupRole(row.groupRole),
    netPnl: formatSignedMoney(row.netPnl),
    joinedAt: row.joinedAt?.toISOString() ?? null,
  };
}

function formatSignedMoney(value: string | number | null | undefined): string {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return "0.00";

  const fixed = numericValue.toFixed(2);
  return numericValue > 0 ? `+${fixed}` : fixed;
}