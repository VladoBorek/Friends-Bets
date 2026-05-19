import { useState } from "react";
import { Ellipsis, KeyRound, ShieldAlert, Trash2, UserRound, Users } from "lucide-react";
import { Button } from "../../../components/ui/button";
import type { UserSummary } from "@pb138/shared/schemas/user";
import { useAuth } from "../../../lib/auth-context";
import type { UserActions, SuspensionUnit } from "../hooks/use-users";

interface UserActionMenuProps {
  user: UserSummary;
  index: number;
  status: "active" | "non-verified" | "suspended";
  actions: UserActions;
}

export function UserActionMenu({ user, index, status, actions }: UserActionMenuProps) {
  const { user: currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSuspensionEditor, setShowSuspensionEditor] = useState(false);
  const [suspensionValue, setSuspensionValue] = useState("24");
  const [suspensionUnit, setSuspensionUnit] = useState<SuspensionUnit>("hours");

  const close = () => {
    setIsOpen(false);
    setShowSuspensionEditor(false);
  };

  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="px-1 py-1 text-slate-400 hover:text-cyan-100"
      >
        <Ellipsis className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          className={`absolute right-0 z-20 rounded-lg border border-slate-700 bg-slate-950/95 p-1.5 shadow-xl shadow-slate-950/60 ${
            showSuspensionEditor ? "w-72 -translate-x-3" : "w-52"
          } ${index < 2 ? "top-9" : "bottom-9"}`}
        >
          {user.roleName === "ADMIN" ? (
            <button
              type="button"
              onClick={() => { actions.updateRole(user, "USER"); close(); }}
              disabled={currentUser?.id === user.id}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <UserRound className="h-4 w-4 text-cyan-300" />
              {currentUser?.id === user.id ? "Cannot Demote Myself" : "Demote to User"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { actions.updateRole(user, "ADMIN"); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70"
            >
              <ShieldAlert className="h-4 w-4 text-cyan-300" />
              Promote to Admin
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setShowSuspensionEditor(!showSuspensionEditor)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70"
          >
            <Users className="h-4 w-4 text-cyan-300" />
            Suspend User
          </button>

          {status === "suspended" && (
            <button
              type="button"
              onClick={() => { actions.unsuspendUser(user); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-emerald-200 transition-colors hover:bg-emerald-500/10"
            >
              <Users className="h-4 w-4 text-emerald-300" />
              Unsuspend User
            </button>
          )}

          {!user.isVerified && (
            <button
              type="button"
              onClick={() => { actions.resendVerification(user); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-amber-200 transition-colors hover:bg-amber-500/10"
            >
              <ShieldAlert className="h-4 w-4 text-amber-300" />
              Resend Verification
            </button>
          )}

          <button
            type="button"
            onClick={() => { actions.resetPassword(user); close(); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-cyan-200 transition-colors hover:bg-cyan-500/10"
          >
            <KeyRound className="h-4 w-4 text-cyan-300" />
            Reset Password
          </button>

          {showSuspensionEditor && (
            <div className="my-1 rounded-md border border-slate-700 bg-slate-900/70 p-2">
              <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={suspensionValue}
                  onChange={(e) => setSuspensionValue(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                />
                <select
                  value={suspensionUnit}
                  onChange={(e) => setSuspensionUnit(e.target.value as SuspensionUnit)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                >
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                  <option value="months">months</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => { actions.suspendUser(user, Number(suspensionValue), suspensionUnit); close(); }}
                  className="h-7 px-2 text-xs"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => { actions.deleteUser(user); close(); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4 text-rose-300" />
            Delete User
          </button>
        </div>
      )}
    </div>
  );
}
