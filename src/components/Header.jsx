import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import { clearSession } from '../utils/auth';

// Branded header: client logo + client name, plus the signed-in user and a
// log-out button. Admins get a link to the admin panel.
export default function Header() {
  const { user, config, setUser } = useApp();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    setUser(null);
    navigate('/login', { replace: true });
  }

  const clientName = config?.clientName || '';

  return (
    <header className="bg-primary text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-9 rounded object-contain bg-white/10 p-0.5"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-semibold truncate">
            {clientName || 'Scoreboard'}
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3 text-sm">
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="hidden sm:inline text-white/90 hover:text-white underline-offset-2 hover:underline"
              >
                Admin
              </button>
            )}
            <span className="hidden sm:inline text-white/80 truncate max-w-[10rem]">
              {user.name || user.username}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-white/15 hover:bg-white/25 px-3 py-1.5 font-medium"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
