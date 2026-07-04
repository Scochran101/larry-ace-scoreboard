import { useState } from 'react';
import { addLagEntry } from '../utils/sheets';
import { currentPeriodKey, periodLabel, formatWithUnit } from '../utils/progress';

// Admin-only form to record the current BAG (lag) value for this period.
// Every submission is a new timestamped row in lag_entries.
export default function LagInput({ bag, user, lagEntries = [], onSubmitted }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const cadence = bag.lagCadence || 'weekly';
  const periodKey = currentPeriodKey(cadence, new Date());

  const ordered = [...lagEntries].sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp))
  );
  const last = ordered[ordered.length - 1];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (value === '' || Number.isNaN(parseFloat(value))) {
      setError('Enter a number.');
      return;
    }
    setSubmitting(true);
    try {
      await addLagEntry({
        timestamp: new Date().toISOString(),
        updated_by: user.name || user.username,
        value: parseFloat(value),
        period: periodKey,
      });
      setValue('');
      setSaved(true);
      if (onSubmitted) await onSubmitted();
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-primary mb-1">Update the BAG</h2>
      <p className="text-xs text-muted mb-4">
        Recording for {cadence === 'monthly' ? 'this month' : 'this week'} (
        {periodLabel(cadence, periodKey)}). {cadence === 'monthly' ? 'Monthly' : 'Weekly'} update.
        {last && ` Last: ${formatWithUnit(last.value, bag.unit)} by ${last.updated_by}.`}
      </p>

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text mb-1">
            Current value{bag.unit ? ` (${bag.unit})` : ''}
          </label>
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="w-full h-11 rounded-xl border border-gray-300 px-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder=""
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-xl bg-primary text-white px-5 font-semibold disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-behind-text">{error}</p>}
      {saved && !error && <p className="mt-2 text-sm text-win-text">Saved.</p>}
    </div>
  );
}
