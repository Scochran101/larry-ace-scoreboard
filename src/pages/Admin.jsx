import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import Header from '../components/Header.jsx';
import StepBag from '../components/setup/StepBag.jsx';
import StepLeadMeasures from '../components/setup/StepLeadMeasures.jsx';
import StepUsers from '../components/setup/StepUsers.jsx';
import StyleSwitcher from '../components/StyleSwitcher.jsx';
import { wizardFromRaw, saveConfig } from '../utils/config';
import { getUsers, writeUsers } from '../utils/sheets';

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

// Admin settings panel: edit the BAG, lead measures, and users without
// re-running the wizard. Reuses the same controlled step components.
export default function Admin() {
  const { config, reloadConfig } = useApp();
  const navigate = useNavigate();

  const [wizard, setWizard] = useState(() => wizardFromRaw(config?.raw || {}));
  const [users, setUsers] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const u = await getUsers();
        if (active) setUsers(u);
      } catch (e) {
        if (active) {
          setError(e.message || 'Could not load users.');
          setUsers([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const patch = (partial) => {
    setSaved(false);
    setWizard((p) => ({ ...p, ...partial }));
  };
  const patchBag = (partial) => {
    setSaved(false);
    setWizard((p) => ({ ...p, bag: { ...p.bag, ...partial } }));
  };
  const setLeadMeasure = (i, partial) => {
    setSaved(false);
    setWizard((p) => ({
      ...p,
      leadMeasures: p.leadMeasures.map((m, idx) => (idx === i ? { ...m, ...partial } : m)),
    }));
  };

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const finalWizard = {
        ...wizard,
        setupComplete: true,
        trackingMode: wizard.scoreboardView === 'individual' ? 'individual' : 'aggregate',
      };
      await saveConfig(finalWizard);

      const finalUsers = (users || [])
        .filter((u) => u.name.trim() && u.username.trim())
        .map((u) => ({
          user_id: u.user_id || newId(),
          name: u.name.trim(),
          username: u.username.trim(),
          role: u.role === 'admin' ? 'admin' : 'team_member',
          team: u.team || '',
          pin_hash: u.pin_hash || '', // preserve existing PIN hashes
        }));
      await writeUsers(finalUsers);

      await reloadConfig();
      setSaved(true);
    } catch (e) {
      setError(e.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Admin settings</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to scoreboard
          </button>
        </div>

        <StyleSwitcher current={config.scoreboardStyle} onChanged={reloadConfig} />

        <Section title="The BAG">
          <StepBag wizard={wizard} patch={patch} patchBag={patchBag} />
        </Section>

        <Section title="Lead measures">
          <StepLeadMeasures wizard={wizard} setLeadMeasure={setLeadMeasure} />
        </Section>

        <Section title="Users">
          {users === null ? (
            <p className="text-muted text-sm">Loading users…</p>
          ) : (
            <StepUsers users={users} setUsers={setUsers} />
          )}
        </Section>

        {error && <p className="text-sm text-behind-text">{error}</p>}

        <div className="sticky bottom-0 bg-background/90 backdrop-blur py-3 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-win-text">Saved.</span>}
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}
