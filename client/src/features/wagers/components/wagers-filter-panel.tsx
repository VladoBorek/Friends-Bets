import type { CategorySummary } from "@pb138/shared/schemas/wager";
import { Input } from "../../../components/ui/input";

export type StatusFilter = "ALL" | "OPEN" | "PENDING" | "CLOSED";
export type InvolvementFilter = "ALL" | "MINE" | "MY_BETS";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
];

interface WagersFilterPanelProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  involvementFilter: InvolvementFilter;
  onInvolvementChange: (v: InvolvementFilter) => void;
  categories: CategorySummary[];
  showInvolvement: boolean;
}

export function WagersFilterPanel({
  search, onSearchChange,
  statusFilter, onStatusChange,
  categoryFilter, onCategoryChange,
  involvementFilter, onInvolvementChange,
  categories,
  showInvolvement,
}: WagersFilterPanelProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Search</label>
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Title or description…"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</label>
        <div className="flex flex-col gap-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(value)}
              className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                statusFilter === value
                  ? "border border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="grid gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white"
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      )}

      {showInvolvement && (
        <div className="grid gap-2">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Involvement</label>
          <div className="flex flex-col gap-1">
            {([ ["ALL", "All wagers"], ["MINE", "Created by me"], ["MY_BETS", "My bets"] ] as [InvolvementFilter, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onInvolvementChange(value)}
                  className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                    involvementFilter === value
                      ? "border border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
