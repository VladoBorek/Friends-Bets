import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { WALLET_TRANSACTION_TYPE_FILTERS, type WalletTransactionTypeFilter } from "../wallet-transactions";

interface WalletTransactionFiltersProps {
  search: string;
  typeFilter: WalletTransactionTypeFilter;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: WalletTransactionTypeFilter) => void;
}

export function WalletTransactionFilters({
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
}: WalletTransactionFiltersProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="grid gap-2">
        <label className="text-xs font-medium uppercase tracking-wider text-slate-500" htmlFor="wallet-transaction-search">
          Search name
        </label>
        <Input
          id="wallet-transaction-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by wager or wallet entry name…"
        />
      </div>

      <div className="grid gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Type</span>
        <div className="flex flex-wrap gap-2">
          {WALLET_TRANSACTION_TYPE_FILTERS.map(({ value, label }) => {
            const isActive = typeFilter === value;

            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "secondary"}
                onClick={() => onTypeFilterChange(value)}
                className="h-8 rounded-full px-3 text-xs"
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}