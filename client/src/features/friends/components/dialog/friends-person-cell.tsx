type FriendPersonCellProps = {
  username: string;
  email: string;
};

function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function FriendPersonCell({ username, email }: FriendPersonCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-200">
        {getInitials(username)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">{username}</p>
        <p className="truncate text-xs text-slate-400">{email}</p>
      </div>
    </div>
  );
}
