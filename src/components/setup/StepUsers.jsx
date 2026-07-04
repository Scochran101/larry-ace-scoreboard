// Step 3 — Users. Editable rows: name, username, role, team (optional).
// No PIN field: each user sets their own 4-digit PIN on first login. Admins
// are visually distinguished by a green role selector.
export default function StepUsers({ users, setUsers }) {
  function updateUser(i, patch) {
    setUsers(users.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
  }
  function addUser() {
    setUsers([...users, { user_id: '', name: '', username: '', role: 'team_member', team: '', pin_hash: '' }]);
  }
  function removeUser(i) {
    setUsers(users.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Add everyone who will use the scoreboard. Usernames are how they log in; they choose their
        own PIN the first time.
      </p>

      <div className="space-y-3">
        {/* Column headers (desktop only) */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-xs font-semibold text-muted">
          <span className="col-span-3">Name</span>
          <span className="col-span-3">Username</span>
          <span className="col-span-3">Role</span>
          <span className="col-span-2">Team / shift</span>
          <span className="col-span-1" />
        </div>

        {users.map((u, i) => {
          const isAdmin = u.role === 'admin';
          return (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-gray-200 p-3 md:p-2">
              <input
                className={`${inputCls} md:col-span-3`}
                placeholder="Name"
                value={u.name}
                onChange={(e) => updateUser(i, { name: e.target.value })}
              />
              <input
                className={`${inputCls} md:col-span-3`}
                placeholder="Username"
                value={u.username}
                onChange={(e) => updateUser(i, { username: e.target.value })}
              />
              <select
                className={`${inputCls} md:col-span-3 font-medium ${
                  isAdmin ? 'border-win text-win-text bg-win/10' : ''
                }`}
                value={u.role}
                onChange={(e) => updateUser(i, { role: e.target.value })}
              >
                <option value="team_member">Team member</option>
                <option value="admin">Admin</option>
              </select>
              <input
                className={`${inputCls} md:col-span-2`}
                placeholder="Optional"
                value={u.team}
                onChange={(e) => updateUser(i, { team: e.target.value })}
              />
              <div className="md:col-span-1 flex md:justify-center">
                <button
                  type="button"
                  onClick={() => removeUser(i)}
                  className="h-9 w-9 rounded-lg text-behind-text hover:bg-behind/10 flex items-center justify-center"
                  aria-label="Remove user"
                  title="Remove user"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-sm text-muted py-2">No users yet — add your first one below.</p>
        )}
      </div>

      <button
        type="button"
        onClick={addUser}
        className="mt-4 rounded-xl border border-primary text-primary font-semibold px-4 py-2.5 hover:bg-primary/5"
      >
        + Add a user
      </button>
    </div>
  );
}

const inputCls =
  'w-full h-10 rounded-lg border border-gray-300 px-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 5v6m4-6v6" />
    </svg>
  );
}
