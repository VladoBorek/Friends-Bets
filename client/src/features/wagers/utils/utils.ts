import { BET_AMOUNT_ERROR_MESSAGE, placeBetRequestSchema } from "@pb138/shared/schemas/wager";
import { WALLET_AMOUNT_ERROR_MESSAGE, walletBalanceMutationRequestSchema } from "@pb138/shared/schemas/wallet";

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  CLOSED: "Closed",
};

export function validateBetInput(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return BET_AMOUNT_ERROR_MESSAGE;

  const validation = placeBetRequestSchema.safeParse({
    outcomeId: 1,
    amount: trimmedValue,
  });

  if (validation.success) return null;
  return validation.error.issues[0]?.message ?? BET_AMOUNT_ERROR_MESSAGE;
}

export function validateWalletCreditInput(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return WALLET_AMOUNT_ERROR_MESSAGE;

  const validation = walletBalanceMutationRequestSchema.safeParse({
    amount: trimmedValue,
  });

  if (validation.success) return null;
  return validation.error.issues[0]?.message ?? WALLET_AMOUNT_ERROR_MESSAGE;
}

export function statusColor(status: string) {
  if (status === "OPEN") return "border-cyan-400/50 bg-cyan-500/15 text-cyan-100";
  if (status === "PENDING") return "border-amber-400/50 bg-amber-500/15 text-amber-100";
  return "border-slate-600 bg-slate-800/50 text-slate-400";
}

export function formatMoney(value: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
}

export function formatCurrency(value: string | number): string {
  return `${formatMoney(value)}`;
}

export function toErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const v = error as { response?: { data?: unknown }; message?: unknown };
    if (typeof v.response?.data === "string" && v.response.data.trim()) return v.response.data;
    if (v.response?.data && typeof v.response.data === "object") {
      const d = v.response.data as { message?: unknown; issues?: Array<{ message?: unknown }> };
      const firstIssue = d.issues?.find((i) => typeof i.message === "string")?.message;
      if (typeof firstIssue === "string" && firstIssue.trim()) return firstIssue;
      if (typeof d.message === "string" && d.message.trim()) return d.message;
    }
    if (typeof v.message === "string" && v.message.trim()) return v.message;
  }
  return "Request failed";
}

// Tailwind safelist — full class strings required for scanner:
// bg-cyan-500 bg-cyan-400 text-cyan-300 border-cyan-500/40 bg-cyan-500/15
// bg-violet-500 bg-violet-400 text-violet-300 border-violet-500/40 bg-violet-500/15
// bg-amber-500 bg-amber-400 text-amber-300 border-amber-500/40 bg-amber-500/15
// bg-emerald-500 bg-emerald-400 text-emerald-300 border-emerald-500/40 bg-emerald-500/15
// bg-rose-500 bg-rose-400 text-rose-300 border-rose-500/40 bg-rose-500/15
// bg-blue-500 bg-blue-400 text-blue-300 border-blue-500/40 bg-blue-500/15
// bg-orange-500 bg-orange-400 text-orange-300 border-orange-500/40 bg-orange-500/15
// bg-pink-500 bg-pink-400 text-pink-300 border-pink-500/40 bg-pink-500/15
function mkColor(c: string) {
  return {
    bar:   `bg-${c}-500`,
    dot:   `bg-${c}-400`,
    label: `text-${c}-300`,
    pill:  `border-${c}-500/40 bg-${c}-500/15 text-${c}-300`,
  };
}

export const OUTCOME_COLORS = [
  mkColor("cyan"),
  mkColor("violet"),
  mkColor("amber"),
  mkColor("emerald"),
  mkColor("rose"),
  mkColor("blue"),
  mkColor("orange"),
  mkColor("pink"),
];
