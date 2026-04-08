import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "../lib/auth-context";
import { LogOut, Users, ShieldAlert, LayoutDashboard, History } from "lucide-react";
import type { UserSummary } from "../../../shared/src/schemas/user";

export function TerminalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleLogout = async () => {
    await logout();
    router.invalidate();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.35em] text-cyan-400">Terminal</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <LayoutDashboard className="h-5 w-5 text-cyan-400" /> Control Panel
          </h2>
        </div>

        <nav className="flex-1 space-y-1">
          <button className="w-full flex justify-start items-center gap-3 rounded-md bg-cyan-950/40 text-cyan-100 px-3 py-2 text-sm font-medium border-l-2 border-cyan-500">
            <Users className="h-4 w-4" /> Users
          </button>
          <button disabled className="w-full flex justify-start items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60 relative group">
            <History className="h-4 w-4" /> Wagers
            <span className="absolute hidden group-hover:block left-full ml-2 bg-slate-800 text-xs px-2 py-1 rounded w-max">Under Construction</span>
          </button>
          <button disabled className="w-full flex justify-start items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60 title='Coming soon' relative group">
            <Users className="h-4 w-4" /> Groups
            <span className="absolute hidden group-hover:block left-full ml-2 bg-slate-800 text-xs px-2 py-1 rounded w-max">Under Construction</span>
          </button>
          <button disabled className="w-full flex justify-start items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 cursor-not-allowed opacity-60 title='Coming soon' relative group">
            <ShieldAlert className="h-4 w-4" /> AuditLog
            <span className="absolute hidden group-hover:block left-full ml-2 bg-slate-800 text-xs px-2 py-1 rounded w-max">Under Construction</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 pb-2">
          <div className="mb-4 text-xs text-slate-400 px-2 py-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-medium text-slate-300">{user?.username}</div>
            <div className="truncate opacity-70 mt-0.5">{user?.email}</div>
            <div className="mt-2 text-[10px] uppercase font-bold text-cyan-500">{user?.roleName}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors w-full justify-center md:justify-start px-2 py-1.5"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-100">User Management</h1>
          <p className="mt-1 text-sm text-slate-400">View and manage authenticated personnel across the system.</p>
        </header>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading system users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No active users found.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-400 uppercase tracking-wider text-xs">User ID</th>
                  <th className="px-6 py-3 font-medium text-slate-400 uppercase tracking-wider text-xs">Identity</th>
                  <th className="px-6 py-3 font-medium text-slate-400 uppercase tracking-wider text-xs">Role</th>
                  <th className="px-6 py-3 font-medium text-slate-400 uppercase tracking-wider text-xs">Registered</th>
                  <th className="px-6 py-3 font-medium text-slate-400 uppercase tracking-wider text-xs text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{u.id}</td>
                    <td className="px-6 py-4 flex flex-col">
                      <span className="font-medium text-slate-200">{u.username}</span>
                      <span className="text-xs text-slate-500">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${u.roleName === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                        {u.roleName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
