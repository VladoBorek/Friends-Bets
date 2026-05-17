export function normalizeStatus(value: string | null): "OPEN" | "PENDING" | "CLOSED" {
  if (value === "OPEN" || value === "PENDING" || value === "CLOSED") {
    return value;
  }

  return "OPEN";
}

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return Number(value);
  }

  return 0;
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

export function calculateOdds(totalPool: number, totalBet: number): string | null {
  if (totalPool <= 0 || totalBet <= 0) {
    return null;
  }

  return (totalPool / totalBet).toFixed(2);
}

export function calculatePayout(totalPool: number, stake: number, winningPool: number): number {
  return Number(((totalPool * stake) / winningPool).toFixed(2));
}
