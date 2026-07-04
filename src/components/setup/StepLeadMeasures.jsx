// Step 2 — Lead Measures. Two cards side by side on desktop, stacked on
// mobile. The cadence dropdown is functional, not cosmetic: it drives the
// grid headers, the cell meaning, the average, and the target basis.
export default function StepLeadMeasures({ wizard, setLeadMeasure }) {
  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Lead measures are the weekly/daily behaviors your team controls that move the BAG. The
        first is required; the second is optional.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MeasureCard
          index={0}
          title="Lead measure 1"
          required
          measure={wizard.leadMeasures[0]}
          onChange={(patch) => setLeadMeasure(0, patch)}
        />
        <MeasureCard
          index={1}
          title="Lead measure 2 (optional)"
          measure={wizard.leadMeasures[1]}
          onChange={(patch) => setLeadMeasure(1, patch)}
        />
      </div>
    </div>
  );
}

const inputCls =
  'w-full h-11 rounded-xl border border-gray-300 px-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function MeasureCard({ title, required, measure, onChange }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-primary">{title}</h3>

      <Field label="Name">
        <input type="text" value={measure.name} onChange={(e) => onChange({ name: e.target.value })} className={inputCls} />
      </Field>

      <Field label="Description" help="A short line explaining the behavior.">
        <input
          type="text"
          value={measure.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit" help='e.g. "calls", "%".'>
          <input type="text" value={measure.unit} onChange={(e) => onChange({ unit: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Target per period">
          <input
            type="number"
            step="any"
            value={measure.target}
            onChange={(e) => onChange({ target: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cadence" help="How often it is counted.">
          <select value={measure.cadence} onChange={(e) => onChange({ cadence: e.target.value })} className={inputCls}>
            <option value="">Choose…</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </Field>
        <Field label="Who enters data">
          <select value={measure.enteredBy} onChange={(e) => onChange({ enteredBy: e.target.value })} className={inputCls}>
            <option value="">Choose…</option>
            <option value="team">Team members</option>
            <option value="admin">Admin only</option>
            <option value="both">Both</option>
          </select>
        </Field>
      </div>

      {!required && (
        <p className="text-xs text-muted">Leave the name blank to use only one lead measure.</p>
      )}
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1">{label}</label>
      {help && <p className="text-xs text-muted mb-1.5">{help}</p>}
      {children}
    </div>
  );
}
