export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  CLOSED: "Closed",
};

export function statusColor(status: string) {
  if (status === "OPEN") return "border-cyan-400/50 bg-cyan-500/15 text-cyan-100";
  if (status === "PENDING") return "border-amber-400/50 bg-amber-500/15 text-amber-100";
  return "border-slate-600 bg-slate-800/50 text-slate-400";
}

export function formatMoney(value: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
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

export const OUTCOME_COLORS = [
  { bar: "bg-cyan-500",    dot: "bg-cyan-400",    label: "text-cyan-300"    },
  { bar: "bg-violet-500",  dot: "bg-violet-400",  label: "text-violet-300"  },
  { bar: "bg-amber-500",   dot: "bg-amber-400",   label: "text-amber-300"   },
  { bar: "bg-emerald-500", dot: "bg-emerald-400", label: "text-emerald-300" },
  { bar: "bg-rose-500",    dot: "bg-rose-400",    label: "text-rose-300"    },
  { bar: "bg-blue-500",    dot: "bg-blue-400",    label: "text-blue-300"    },
  { bar: "bg-orange-500",  dot: "bg-orange-400",  label: "text-orange-300"  },
  { bar: "bg-pink-500",    dot: "bg-pink-400",    label: "text-pink-300"    },
] as const;
