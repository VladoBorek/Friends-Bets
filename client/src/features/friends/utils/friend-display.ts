import type { FriendSummary, FriendWagerSummary } from "@pb138/shared/schemas/friends";

export function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatRecord(friend: FriendSummary, options?: { includeZeroDraws?: boolean }) {
  const { wins, losses, draws } = friend.stats;

  if (draws > 0 || options?.includeZeroDraws) {
    return `${wins}W - ${losses}L - ${draws}D`;
  }

  return `${wins}W - ${losses}L`;
}

export function formatMoney(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

export function formatSignedMoney(value: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  const fixed = numericValue.toFixed(2);
  return numericValue > 0 ? `+${fixed}` : fixed;
}

export function getMoneyTone(value: string, neutralClassName = "text-slate-300") {
  const numericValue = Number(value);

  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";

  return neutralClassName;
}

export function getHeadToHeadMeta(result: FriendWagerSummary["headToHeadResult"]) {
  if (result === "WIN") {
    return { label: "YOU WON", className: "text-emerald-300" };
  }

  if (result === "LOSS") {
    return { label: "YOU LOST", className: "text-rose-300" };
  }

  return { label: "DRAW", className: "text-amber-300" };
}