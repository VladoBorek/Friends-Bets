import { Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { AdminCategorySummary } from "../hooks/use-categories";

interface CategoryPanelProps {
  categories: AdminCategorySummary[];
  isLoading: boolean;
  isSubmitting: boolean;
  newCategoryName: string;
  onCategoryNameChange: (value: string) => void;
  onAddCategory: () => Promise<void>;
  onDeleteCategory: (category: AdminCategorySummary) => Promise<void>;
}

export function CategoryPanel({
  categories,
  isLoading,
  isSubmitting,
  newCategoryName,
  onCategoryNameChange,
  onAddCategory,
  onDeleteCategory,
}: CategoryPanelProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-base font-semibold text-slate-100">Add Category</h2>
        <p className="mt-1 text-xs text-slate-400">Create a category for new wagers.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={newCategoryName}
            onChange={(event) => onCategoryNameChange(event.target.value)}
            placeholder="e.g. Sports"
            disabled={isSubmitting}
            className="sm:max-w-sm"
          />
          <Button
            type="button"
            onClick={() => void onAddCategory()}
            disabled={isSubmitting}
          >
            Add Category
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        {isLoading ? (
          <div className="p-6 text-center text-slate-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No categories found.</div>
        ) : (
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead className="border-b border-slate-800 bg-slate-900/80">
              <tr>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Category</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Wagers</th>
                <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Bets</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {categories.map((category) => {
                const canDelete = category.betCount === 0 && category.wagerCount === 0;
                return (
                  <tr key={category.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-4 text-slate-200">{category.name}</td>
                    <td className="px-5 py-4 text-slate-400">{category.wagerCount}</td>
                    <td className="px-5 py-4 text-slate-400">{category.betCount}</td>
                    <td className="px-2 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void onDeleteCategory(category)}
                        disabled={!canDelete || isSubmitting}
                        className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 disabled:text-slate-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
