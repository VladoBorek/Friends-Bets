import { useEffect, useState } from "react";
import { Ellipsis, LayoutDashboard, ShieldAlert, Tags, Trash2, UserRound, Users } from "lucide-react";
import type { UserSummary } from "../../../shared/src/schemas/user";
import { PremiumCard, PremiumCardLabel, PremiumCardValue } from "../components/ui/card";
import { useAuth } from "../lib/auth-context";

export function TerminalPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openMenuForUserId, setOpenMenuForUserId] = useState<number | null>(null);
  const [suspensionEditorForUserId, setSuspensionEditorForUserId] = useState<number | null>(null);
  const [suspensionValue, setSuspensionValue] = useState("24");
  const [suspensionUnit, setSuspensionUnit] = useState<"hours" | "days" | "months">("hours");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const json = (await res.json()) as { data: UserSummary[] };
        setUsers(json.data);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((entry) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    return (
      entry.username.toLowerCase().includes(normalizedQuery) ||
      entry.email.toLowerCase().includes(normalizedQuery) ||
      entry.roleName.toLowerCase().includes(normalizedQuery)
    );
  });

  const totalUsers = users.length;
  const adminUsers = users.filter((entry) => entry.roleName === "ADMIN").length;
  const standardUsers = totalUsers - adminUsers;

  const refreshUsers = async () => {
    await fetchUsers();
  };

  const handleDeleteUser = async (user: UserSummary) => {
    setOpenMenuForUserId(null);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const message = (await res.json().catch(() => null)) as { message?: string } | null;
      window.alert(message?.message ?? "Failed to delete user.");
      return;
    }
    await refreshUsers();
  };

  const handleRoleChange = async (user: UserSummary, roleName: "ADMIN" | "USER") => {
    setOpenMenuForUserId(null);
    const res = await fetch(`/api/users/${user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleName }),
    });
    if (!res.ok) {
      const message = (await res.json().catch(() => null)) as { message?: string } | null;
      window.alert(message?.message ?? "Failed to update role.");
      return;
    }
    await refreshUsers();
  };

  const handleSuspendUser = async (user: UserSummary) => {
    const durationValue = Number(suspensionValue);
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      window.alert("Duration must be a positive number.");
      return;
    }

    const res = await fetch(`/api/users/${user.id}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationValue, durationUnit: suspensionUnit }),
    });

    if (!res.ok) {
      const message = (await res.json().catch(() => null)) as { message?: string } | null;
      window.alert(message?.message ?? "Failed to suspend user.");
      return;
    }

    setOpenMenuForUserId(null);
    setSuspensionEditorForUserId(null);
    await refreshUsers();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-[90rem] gap-6 px-6 pb-6 pt-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-8 lg:pt-2">
        <main onClick={() => setOpenMenuForUserId(null)}>
          <header className="mb-6">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Admin</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-100">
              <LayoutDashboard className="h-6 w-6 text-cyan-400" /> Terminal
            </h1>
            <p className="mt-1 text-sm text-slate-400">Manage users, review system activity, and monitor administration flows.</p>
          </header>

          <nav className="mb-6 inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-700/70 bg-slate-900/55 p-1">
            <button className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/16 px-3 py-1.5 text-sm font-medium text-cyan-100">
              <UserRound className="h-4 w-4" />
              <span>Users</span>
            </button>
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-slate-500"
            >
              <Users className="h-4 w-4" />
              <span>Groups</span>
            </button>
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-slate-500"
            >
              <Tags className="h-4 w-4" />
              <span>Categories</span>
            </button>
          </nav>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <PremiumCard>
              <PremiumCardLabel>Total Users</PremiumCardLabel>
              <PremiumCardValue>{totalUsers}</PremiumCardValue>
            </PremiumCard>
            <PremiumCard className="border-indigo-500/25 from-slate-900/90 via-indigo-950/20 to-slate-900/80">
              <PremiumCardLabel className="text-indigo-200/85">Admin Users</PremiumCardLabel>
              <PremiumCardValue className="text-indigo-100">{adminUsers}</PremiumCardValue>
            </PremiumCard>
            <PremiumCard className="border-cyan-400/25 from-slate-900/90 via-cyan-950/35 to-slate-900/80">
              <PremiumCardLabel>Standard Users</PremiumCardLabel>
              <PremiumCardValue className="text-cyan-100">{standardUsers}</PremiumCardValue>
            </PremiumCard>
          </section>

          <section className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-slate-900/88 via-slate-900/82 to-cyan-950/18 p-4 shadow-lg shadow-slate-950/25 transition-shadow duration-200 hover:shadow-[0_20px_44px_-26px_rgba(8,145,178,0.65)]">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Users Table</h2>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="select user, role, email..."
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/60 sm:max-w-xs"
              />
            </div>

            <div className="overflow-x-auto overflow-y-visible rounded-xl border border-slate-800 bg-slate-900/50">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Loading system users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No matching users found.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/80">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">User ID</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Identity</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Role</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Registered</th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Suspended Until</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredUsers.map((entry, index) => (
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
                        <td className="px-6 py-4 text-slate-400">
                          {entry.suspendedUntil ? new Date(entry.suspendedUntil).toLocaleString() : "Active"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenuForUserId((current) => (current === entry.id ? null : entry.id));
                              }}
                              className="inline-flex items-center px-1 py-1 text-slate-400 transition-colors hover:text-cyan-100"
                              aria-label={`open actions for ${entry.username}`}
                            >
                              <Ellipsis className="h-4 w-4" />
                            </button>

                            {openMenuForUserId === entry.id && (
                              <div
                                className={`absolute right-0 z-20 w-52 rounded-lg border border-slate-700 bg-slate-950/95 p-1.5 shadow-xl shadow-slate-950/60 ${
                                  index < 2 ? "top-9" : "bottom-9"
                                }`}
                              >
                                {entry.roleName === "ADMIN" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRoleChange(entry, "USER")}
                                    disabled={currentUser?.id === entry.id}
                                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <UserRound className="h-4 w-4 text-cyan-300" />
                                    {currentUser?.id === entry.id ? "Cannot Demote Myself" : "Demote to User"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRoleChange(entry, "ADMIN")}
                                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70"
                                  >
                                    <ShieldAlert className="h-4 w-4 text-cyan-300" />
                                    Promote to Admin
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSuspensionEditorForUserId((current) => (current === entry.id ? null : entry.id))
                                  }
                                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70"
                                >
                                  <Users className="h-4 w-4 text-cyan-300" />
                                  Suspend User
                                </button>
                                {suspensionEditorForUserId === entry.id && (
                                  <div className="my-1 rounded-md border border-slate-700 bg-slate-900/70 p-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        min={1}
                                        value={suspensionValue}
                                        onChange={(event) => setSuspensionValue(event.target.value)}
                                        className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                                      />
                                      <select
                                        value={suspensionUnit}
                                        onChange={(event) => setSuspensionUnit(event.target.value as "hours" | "days" | "months")}
                                        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                                      >
                                        <option value="hours">hours</option>
                                        <option value="days">days</option>
                                        <option value="months">months</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => handleSuspendUser(entry)}
                                        className="rounded border border-cyan-500/30 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-500/10"
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(entry)}
                                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-4 w-4 text-rose-300" />
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>

        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-100">
              <ShieldAlert className="h-4 w-4 text-cyan-300" /> Audit Log
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-200">Users module active</p>
                <p className="mt-1 text-xs text-slate-500">Live management view enabled.</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-500">Groups module</p>
                <p className="mt-1 text-xs text-slate-600">Under Construction</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-500">Categories module</p>
                <p className="mt-1 text-xs text-slate-600">Under Construction</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
