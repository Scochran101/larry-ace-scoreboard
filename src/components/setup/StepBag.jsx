// Step 1 of the setup wizard — the BAG. Every field ships empty; the labels
// and helper text explain what goes where.
export default function StepBag({ wizard, patch, patchBag }) {
  const bag = wizard.bag;
  return (
    <div className="space-y-5">
      <Field label="Client / team name" help="Shown in the header at the top of the scoreboard.">
        <input
          type="text"
          value={wizard.clientName}
          onChange={(e) => patch({ clientName: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Goal statement" help="The one sentence that describes the big goal.">
        <textarea
          rows={2}
          value={bag.statement}
          onChange={(e) => patchBag({ statement: e.target.value })}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Start value" help="Where the number is today, before the push.">
          <input
            type="number"
            step="any"
            value={bag.startValue}
            onChange={(e) => patchBag({ startValue: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Target value" help="The number you want to reach by the deadline.">
          <input
            type="number"
            step="any"
            value={bag.targetValue}
            onChange={(e) => patchBag({ targetValue: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Unit of measurement" help='e.g. "customers per day", "%", "sales".'>
          <input
            type="text"
            value={bag.unit}
            onChange={(e) => patchBag({ unit: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Deadline" help="The date the goal must be reached.">
          <input
            type="date"
            value={bag.deadline}
            onChange={(e) => patchBag({ deadline: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Who updates the lag measure">
          <select value="admin" disabled className={`${inputCls} bg-gray-50`}>
            <option value="admin">Admin only</option>
          </select>
        </Field>
        <Field label="Lag update cadence" help="How often the BAG value is updated.">
          <select
            value={bag.lagCadence}
            onChange={(e) => patchBag({ lagCadence: e.target.value })}
            className={inputCls}
          >
            <option value="">Choose…</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </Field>
      </div>

      <Field label="Scoreboard view" help="How the lead measures are counted and shown.">
        <div className="space-y-2">
          <RadioCard
            checked={wizard.scoreboardView === 'team_total'}
            onChange={() => patch({ scoreboardView: 'team_total' })}
            title="Team total per period, counted per period"
            desc="One combined number per period (bar chart)."
          />
          <RadioCard
            checked={wizard.scoreboardView === 'individual'}
            onChange={() => patch({ scoreboardView: 'individual' })}
            title="Individual contributions per period, counted per period"
            desc="Each person's numbers in a grid, with a team total row."
          />
        </div>
      </Field>
    </div>
  );
}

const inputCls =
  'w-full h-11 rounded-xl border border-gray-300 px-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1">{label}</label>
      {help && <p className="text-xs text-muted mb-1.5">{help}</p>}
      {children}
    </div>
  );
}

function RadioCard({ checked, onChange, title, desc }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left rounded-xl border p-3 transition ${
        checked ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${
            checked ? 'border-primary bg-primary' : 'border-gray-400'
          }`}
        />
        <div>
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
    </button>
  );
}
