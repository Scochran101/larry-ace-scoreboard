import { useState } from 'react';
import StepBag from './StepBag.jsx';
import StepLeadMeasures from './StepLeadMeasures.jsx';
import StepUsers from './StepUsers.jsx';
import StepStyle from './StepStyle.jsx';
import { saveConfig } from '../../utils/config';
import { writeUsers } from '../../utils/sheets';
import { dateKey } from '../../utils/progress';

const STEPS = ['The BAG', 'Lead Measures', 'Users', 'Style'];

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

// 4-step wizard shell: progress bar, one step per screen, Back / Next, and
// a Finish that writes all config + users to the Sheet and flips setup on.
export default function SetupWizard({ initialWizard, initialUsers = [], onComplete }) {
  const [wizard, setWizard] = useState(initialWizard);
  const [users, setUsers] = useState(initialUsers);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const patch = (partial) => setWizard((p) => ({ ...p, ...partial }));
  const patchBag = (partial) => setWizard((p) => ({ ...p, bag: { ...p.bag, ...partial } }));
  const setLeadMeasure = (i, partial) =>
    setWizard((p) => ({
      ...p,
      leadMeasures: p.leadMeasures.map((m, idx) => (idx === i ? { ...m, ...partial } : m)),
    }));

  function isStepValid(s) {
    const b = wizard.bag;
    if (s === 1) {
      return (
        wizard.clientName.trim() &&
        b.statement.trim() &&
        b.startValue !== '' &&
        b.targetValue !== '' &&
        b.deadline &&
        b.lagCadence &&
        wizard.scoreboardView
      );
    }
    if (s === 2) {
      const lm = wizard.leadMeasures[0];
      return lm.name.trim() && lm.target !== '' && lm.cadence && lm.enteredBy;
    }
    if (s === 3) {
      return users.some((u) => u.name.trim() && u.username.trim());
    }
    if (s === 4) {
      return !!wizard.scoreboardStyle;
    }
    return true;
  }

  async function finish() {
    setError('');
    setSaving(true);
    try {
      const finalUsers = users
        .filter((u) => u.name.trim() && u.username.trim())
        .map((u) => ({
          user_id: u.user_id || newId(),
          name: u.name.trim(),
          username: u.username.trim(),
          role: u.role === 'admin' ? 'admin' : 'team_member',
          team: u.team || '',
          pin_hash: u.pin_hash || '',
        }));

      const finalWizard = {
        ...wizard,
        setupComplete: true,
        trackingMode: wizard.scoreboardView === 'individual' ? 'individual' : 'aggregate',
        bag: { ...wizard.bag, startDate: wizard.bag.startDate || dateKey(new Date()) },
      };

      await saveConfig(finalWizard);
      await writeUsers(finalUsers);
      await onComplete();
    } catch (e) {
      setError(e.message || 'Could not save your setup. Please try again.');
      setSaving(false);
    }
  }

  function next() {
    if (!isStepValid(step)) return;
    if (step === 4) finish();
    else setStep((s) => s + 1);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Progress bar — four labeled segments */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={label}>
              <div
                className={`h-2 rounded-full ${
                  done || active ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
              <p
                className={`mt-1.5 text-xs ${
                  active ? 'text-primary font-semibold' : 'text-muted'
                }`}
              >
                {n}. {label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold text-primary mb-4">
          Step {step}: {STEPS[step - 1]}
        </h1>

        {step === 1 && <StepBag wizard={wizard} patch={patch} patchBag={patchBag} />}
        {step === 2 && <StepLeadMeasures wizard={wizard} setLeadMeasure={setLeadMeasure} />}
        {step === 3 && <StepUsers users={users} setUsers={setUsers} />}
        {step === 4 && <StepStyle wizard={wizard} patch={patch} />}

        {error && <p className="mt-4 text-sm text-behind-text">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || saving}
          className="rounded-xl border border-gray-300 px-5 py-2.5 font-semibold text-text disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!isStepValid(step) || saving}
          className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {step === 4 ? (saving ? 'Finishing…' : 'Finish setup') : 'Next'}
        </button>
      </div>
      {!isStepValid(step) && !saving && (
        <p className="mt-2 text-right text-xs text-muted">
          Fill in the required fields to continue.
        </p>
      )}
    </div>
  );
}
