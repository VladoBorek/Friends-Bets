import type { GroupPreviewMember } from "@pb138/shared/schemas/groups";

export function getMoneyTone(value: string) {
  const numericValue = Number(value);

  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";

  return "text-slate-300";
}

export function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function buildPreviewRows(topMembers: GroupPreviewMember[]) {
  return Array.from({ length: 3 }, (_, index) => topMembers[index] ?? null);
}

export function getGroupDescription(description: string | null | undefined) {
  return description?.trim() || "No description provided.";
}

export function canExpandDescription(description: string) {
  return description.length > 180 || description.includes("\n");
}