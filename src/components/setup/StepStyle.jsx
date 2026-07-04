import BagTrendChart from '../scoreboard/BagTrendChart.jsx';
import BagProgressBar from '../scoreboard/BagProgressBar.jsx';
import { dateKey } from '../../utils/progress';

// Step 4 — Scoreboard Style. Two options only, each shown as a LIVE preview
// rendered with the BAG data entered in Steps 1–2.
export default function StepStyle({ wizard, patch }) {
  const bag = {
    statement: wizard.bag.statement,
    unit: wizard.bag.unit,
    startValue: parseFloat(wizard.bag.startValue) || 0,
    targetValue: parseFloat(wizard.bag.targetValue) || 0,
    // Not saved until finish, so use today for the preview's proration.
    startDate: wizard.bag.startDate || dateKey(new Date()),
    deadline: wizard.bag.deadline,
    lagCadence: wizard.bag.lagCadence || 'weekly',
  };

  const options = [
    { value: 'trend_chart', label: 'Trend chart', node: <BagTrendChart bag={bag} lagEntries={[]} /> },
    { value: 'progress_bars', label: 'Progress bars', node: <BagProgressBar bag={bag} lagEntries={[]} /> },
  ];

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Pick how the BAG is shown. You can change this anytime from the admin panel — the
        switch applies to everyone instantly.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {options.map((opt) => {
          const selected = wizard.scoreboardStyle === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => patch({ scoreboardStyle: opt.value })}
              className={`text-left rounded-2xl border p-3 transition ${
                selected ? 'border-primary ring-2 ring-primary/25' : 'border-gray-300 hover:border-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-semibold text-text">{opt.label}</span>
                <span
                  className={`h-4 w-4 rounded-full border-2 ${
                    selected ? 'border-primary bg-primary' : 'border-gray-400'
                  }`}
                />
              </div>
              <div className="pointer-events-none">{opt.node}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
