import { useState } from 'react';
import { updateConfig } from '../utils/sheets';

// Admin control to switch the scoreboard style. Changes are written to the
// config Sheet immediately, so every user sees the new style on next load.
const OPTIONS = [
  { value: 'trend_chart', label: 'Trend chart' },
  { value: 'progress_bars', label: 'Progress bars' },
];

export default function StyleSwitcher({ current, onChanged }) {
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  async function choose(value) {
    if (value === current || saving) return;
    setError('');
    setSaving(value);
    try {
      await updateConfig({ scoreboard_style: value });
      if (onChanged) await onChanged();
    } catch (e) {
      setError(e.message || 'Could not change the style.');
    } finally {
      setSaving('');
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-primary mb-1">Scoreboard style</h2>
      <p className="text-xs text-muted mb-3">Changes apply to everyone immediately.</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => choose(opt.value)}
              disabled={!!saving}
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 text-text hover:border-primary'
              }`}
            >
              {saving === opt.value ? 'Saving…' : opt.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-behind-text">{error}</p>}
    </div>
  );
}
