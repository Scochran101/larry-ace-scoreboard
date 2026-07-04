import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import SetupWizard from '../components/setup/SetupWizard.jsx';
import { wizardFromRaw } from '../utils/config';
import { getUsers } from '../utils/sheets';

// First-launch setup. Admin-only (enforced in App). If setup is already
// complete, there's nothing to do here — send them to the dashboard.
export default function Setup() {
  const { config, reloadConfig } = useApp();
  const navigate = useNavigate();
  const [initialUsers, setInitialUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (config?.setupComplete) {
      navigate('/', { replace: true });
    }
  }, [config, navigate]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const users = await getUsers();
        if (active) setInitialUsers(users);
      } catch (e) {
        if (active) {
          setError(e.message || 'Could not load existing users.');
          setInitialUsers([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (config?.setupComplete) return null;
  if (initialUsers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">Loading setup…</div>
    );
  }

  const initialWizard = wizardFromRaw(config?.raw || {});

  return (
    <div className="min-h-screen">
      <div className="bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="font-semibold">Set up your scoreboard</h1>
          <p className="text-white/70 text-sm">Four quick steps. You can change everything later.</p>
        </div>
      </div>
      {error && (
        <p className="max-w-3xl mx-auto px-4 pt-3 text-sm text-behind-text">{error}</p>
      )}
      <SetupWizard
        initialWizard={initialWizard}
        initialUsers={initialUsers}
        onComplete={async () => {
          await reloadConfig();
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}
