import type { UserSummary } from "@pb138/shared/schemas/user";

export type UserRow = {
  id: number;
  username: string;
  email: string;
  roleName: string | null;
  isVerified: boolean | null;
  suspendedUntil: Date | null;
  createdAt: Date | null;
};

export function normalizeRoleName(roleName: unknown): string {
  if (typeof roleName !== "string" || roleName.trim().length === 0) {
    return "USER";
  }

  return roleName.toUpperCase();
}

export function mapUserSummary(row: UserRow): UserSummary {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    roleName: normalizeRoleName(row.roleName),
    isVerified: row.isVerified ?? false,
    suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}
