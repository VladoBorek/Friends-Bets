import { Input } from "../../../components/ui/input";
import type { UserSummary } from "@pb138/shared/schemas/user";
import { FriendsPagination } from "../../friends/components/friends-pagination";
import { UserActionMenu } from "./user-action-menu";
import type { UserActions } from "../hooks/use-users";

type PaginationState = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

interface UserTableProps {
  users: UserSummary[];
  isLoading: boolean;
  query: string;
  pagination: PaginationState | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onQueryChange: (query: string) => void;
  actions: UserActions;
}

export function UserTable({
  users,
  isLoading,
  query,
  pagination,
  currentPage,
  totalPages,
  onPageChange,
  onQueryChange,
  actions,
}: UserTableProps) {
  const getUserStatus = (entry: UserSummary): "active" | "non-verified" | "suspended" => {
    if (entry.suspendedUntil && new Date(entry.suspendedUntil) > new Date()) {
      return "suspended";
    }
    if (!entry.isVerified) {
      return "non-verified";
    }
    return "active";
  };

  const statusBadgeStyles = {
    active: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
    "non-verified": "border-amber-500/30 bg-amber-500/12 text-amber-300",
    suspended: "border-rose-500/30 bg-rose-500/12 text-rose-300",
  };

  const statusLabel = {
    active: "Active",
    "non-verified": "Non-Verified",
    suspended: "Suspended",
  };

  const firstVisible = pagination && pagination.total > 0
    ? Math.min(pagination.offset + 1, pagination.total)
    : 0;
  const lastVisible = pagination
    ? Math.min(pagination.offset + users.length, pagination.total)
    : users.length;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Users Table</h2>
          {pagination && pagination.total > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Showing {firstVisible}-{lastVisible} of {pagination.total}
            </p>
          )}
        </div>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="select user, role, email..."
          className="sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto overflow-y-visible rounded-xl border border-slate-800 bg-slate-900/50">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading system users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No matching users found.</div>
        ) : (
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[80px]" />
              <col />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[140px]" />
              <col className="w-[72px]" />
            </colgroup>
            <thead className="border-b border-slate-800/50 bg-slate-900/80">
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">User ID</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Identity</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Role</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Registered</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-slate-800/50">
              {users.map((entry, index) => {
                const status = getUserStatus(entry);
                return (
                  <tr key={entry.id} className="transition-colors hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{entry.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{entry.username}</span>
                        <span className="text-xs text-slate-500">{entry.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          entry.roleName === "ADMIN"
                            ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                            : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                        }`}
                      >
                        {entry.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyles[status]}`}
                      >
                        {statusLabel[status]}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-right">
                      <UserActionMenu
                        user={entry}
                        index={index}
                        status={status}
                        actions={actions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && pagination && pagination.total > 0 && (
        <div className="mt-5">
          <FriendsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}