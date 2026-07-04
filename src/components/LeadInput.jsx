import { useMemo, useState } from 'react';
import { addLeadEntry } from '../utils/sheets';
import {
  currentPeriodKey,
  sumForUserPeriod,
  formatWithUnit,
} from '../utils/progress';

// Mobile-first log screen. For each measure the user is responsible for:
// a large plus button, the running total for the current period next to it,
// the target for reference. Taps increment a LOCAL counter; Submit writes
// that counter to the Sheet as one timestamped, additive entry.
export default function LeadInput({ measures = [], user, entries = [], trackingMode, onSubmitted }) {
  const [pending, setPending] = useState({}); // { measureId: count }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const now = new Date();

  // Already-submitted total for the current period, per measure.
  const submittedTotals = useMemo(() => {
    const totals = {};
    measures.forEach((m) => {
      const key = currentPeriodKey(m.cadence, now);
      totals[m.id] = sumForUserPeriod(entries, user.user_id, m.id, key);
    });
    return totals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measures, entries, user.user_id]);

  const totalPending = Object.values(pending).reduce((a, b) => a + (b || 0), 0);

  function bump(measureId, delta) {
    setJustSaved(false);
    setPending((prev) => {
      const next = Math.max(0, (prev[measureId] || 0) + delta);
      return { ...prev, [measureId]: next };
    });
  }

  async function handleSubmit() {
    setError('');
    const toWrite = measures.filter((m) => (pending[m.id] || 0) > 0);
    if (toWrite.length === 0) return;

    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      for (const m of toWrite) {
        await addLeadEntry({
          timestamp,
          user_id: user.user_id,
          user_name: user.name || user.username,
          team: user.team || '',
          measure_id: m.id,
          measure_name: m.name,
          value: pending[m.id],
          period: currentPeriodKey(m.cadence, new Date()),
        });
      }
      setPending({});
      setJustSaved(true);
      if (onSubmitted) await onSubmitted();
    } catch (e) {
      setError(e.message || 'Could not save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (measures.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-muted text-sm">
        There are no lead measures for you to log right now.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-primary mb-1">Log your numbers</h2>
      <p className="text-xs text-muted mb-4">
        Tap <span className="font-semibold">+</span> once per occurrence — multiple taps add up.
        You can submit as many times a day as you like; every submission adds on.
      </p>

      <div className="space-y-4">
        {measures.map((m) => {
          const period = m.cadence === 'daily' ? 'today' : 'this week';
          const running = (submittedTotals[m.id] || 0) + (pending[m.id] || 0);
          return (
            <div key={m.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">{m.name}</p>
                  <p className="text-xs text-muted">
                    {trackingMode === 'aggregate' ? 'Team target' : 'Your target'}{' '}
                    {period}: {formatWithUnit(m.target, m.unit)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-accent leading-none">{running}</div>
                  <div className="text-[11px] text-muted">{period}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => bump(m.id, 1)}
                  className="flex-1 h-14 rounded-xl bg-accent text-white text-2xl font-bold active:scale-[0.98] transition"
                  aria-label={`Add one to ${m.name}`}
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => bump(m.id, -1)}
                  disabled={(pending[m.id] || 0) === 0}
                  className="h-14 w-14 rounded-xl border border-gray-300 text-2xl font-bold text-muted disabled:opacity-40"
                  aria-label={`Undo one for ${m.name}`}
                >
                  −
                </button>
              </div>

              {(pending[m.id] || 0) > 0 && (
                <p className="mt-2 text-xs text-accent font-medium">
                  +{pending[m.id]} not yet submitted
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-behind-text">{error}</p>}
      {justSaved && !error && (
        <p className="mt-3 text-sm text-win-text">Saved. Nice work.</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || totalPending === 0}
        className="mt-4 w-full h-12 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Submit'}
      </button>
    </div>
  );
}
