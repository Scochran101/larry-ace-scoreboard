import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getSession } from './utils/auth';
import { loadConfig } from './utils/config';
import Login from './pages/Login.jsx';
import Setup from './pages/Setup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';

// ---- Shared app state (current user + live config) --------------------
const AppContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  return useContext(AppContext);
}

function FullScreen({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      {children}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => getSession());
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState('');

  const reloadConfig = useCallback(async () => {
    const cfg = await loadConfig();
    setConfig(cfg);
    return cfg;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus('loading');
        await reloadConfig();
        if (active) setStatus('ready');
      } catch (e) {
        if (active) {
          setError(e.message || 'Could not load configuration.');
          setStatus('error');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadConfig]);

  if (status === 'loading') {
    return (
      <FullScreen>
        <div className="text-muted animate-pulse">Loading…</div>
      </FullScreen>
    );
  }

  if (status === 'error') {
    return (
      <FullScreen>
        <div className="max-w-md">
          <h1 className="text-xl font-semibold text-primary mb-2">
            Can’t reach the scoreboard data
          </h1>
          <p className="text-muted mb-4">{error}</p>
          <p className="text-sm text-muted">
            Check that the Google Sheet environment variables are set in Vercel
            and that the Sheet is shared with the service account. See the
            README’s Troubleshooting section.
          </p>
        </div>
      </FullScreen>
    );
  }

  const ctx = { user, setUser, config, reloadConfig };

  return (
    <AppContext.Provider value={ctx}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/setup"
          element={
            <RequireAdmin user={user}>
              <Setup />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin user={user}>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth user={user}>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  );
}

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Any attempt to reach an admin route as a team member is bounced to the
// dashboard (per the auth requirements).
function RequireAdmin({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
