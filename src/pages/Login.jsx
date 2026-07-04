import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import PinEntry from '../components/PinEntry.jsx';
import { login, setPinForUser, createBootstrapAdmin } from '../utils/auth';

// Username + 4-digit PIN login. Handles three phases:
//  - 'login'         enter username + PIN
//  - 'set_pin'       known user with no PIN yet chooses one
//  - 'bootstrap_pin' starter admin chooses a permanent PIN
export default function Login() {
  const { user, config, setUser } = useApp();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('login');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already logged in? Leave the login page.
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  async function handleLogin() {
    if (!username.trim() || pin.length !== 4) return;
    setError('');
    setBusy(true);
    try {
      const result = await login(username, pin);
      if (result.status === 'ok') {
        setUser(result.user);
        navigate('/', { replace: true });
      } else if (result.status === 'set_pin') {
        setPendingUser(result.user);
        setPhase('set_pin');
        setPin('');
      } else if (result.status === 'bootstrap_admin') {
        setPhase('bootstrap_pin');
        setPin('');
      }
    } catch (e) {
      setError(e.message || 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleChoosePin() {
    if (newPin.length !== 4) return;
    if (newPin !== confirmPin) {
      setError('The two PINs do not match.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const u =
        phase === 'set_pin'
          ? await setPinForUser(pendingUser, newPin)
          : await createBootstrapAdmin(username, newPin);
      setUser(u);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not set your PIN.');
    } finally {
      setBusy(false);
    }
  }

  const settingPin = phase === 'set_pin' || phase === 'bootstrap_pin';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt=""
            className="mx-auto h-14 w-14 rounded-xl object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="mt-3 text-xl font-bold text-primary">
            {config?.clientName || 'Scoreboard'}
          </h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {!settingPin && (
            <>
              <label className="block text-sm font-medium text-text mb-1">Username</label>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-300 px-3 mb-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="mb-4">
                <PinEntry
                  value={pin}
                  onChange={setPin}
                  onComplete={() => {}}
                  label="4-digit PIN"
                  autoFocus={false}
                />
              </div>
              {error && <p className="text-sm text-behind-text mb-3 text-center">{error}</p>}
              <button
                onClick={handleLogin}
                disabled={busy || !username.trim() || pin.length !== 4}
                className="w-full h-12 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
              >
                {busy ? 'Checking…' : 'Log in'}
              </button>
              <p className="mt-3 text-xs text-muted text-center">
                First time? Enter your username and choose any 4-digit PIN — it becomes yours.
              </p>
            </>
          )}

          {settingPin && (
            <>
              <h2 className="text-base font-semibold text-primary mb-1 text-center">
                {phase === 'bootstrap_pin' ? 'Create your admin PIN' : 'Create your PIN'}
              </h2>
              <p className="text-xs text-muted mb-4 text-center">
                Pick a 4-digit PIN you’ll remember. You’ll use it to log in from now on.
              </p>
              <div className="mb-4">
                <PinEntry value={newPin} onChange={setNewPin} label="New PIN" autoFocus />
              </div>
              <div className="mb-4">
                <PinEntry value={confirmPin} onChange={setConfirmPin} label="Confirm PIN" autoFocus={false} />
              </div>
              {error && <p className="text-sm text-behind-text mb-3 text-center">{error}</p>}
              <button
                onClick={handleChoosePin}
                disabled={busy || newPin.length !== 4 || confirmPin.length !== 4}
                className="w-full h-12 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Set PIN & continue'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
