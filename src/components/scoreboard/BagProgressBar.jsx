import StatusLabel from './StatusLabel.jsx';
import { useBrandColors } from '../../utils/theme';
import {
  proratedTarget,
  statusFor,
  formatWithUnit,
  clamp,
} from '../../utils/progress';

// Section 1 of the scoreboard in the "Progress bars" style: the BAG as a
// horizontal bar from start to target, with the current value filled in the
// accent color and a dashed marker showing where the team should be today.
export default function BagProgressBar({ bag, lagEntries = [], updatedByName, nextUpdateDate }) {
  const colors = useBrandColors();

  // Latest lag value (or the start value if none yet).
  const ordered = [...lagEntries].sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp))
  );
  const latest = ordered[ordered.length - 1];
  const currentValue =
    latest && latest.value !== '' ? parseFloat(latest.value) : bag.startValue;

  const proratedNow = proratedTarget({
    startValue: bag.startValue,
    targetValue: bag.targetValue,
    startDate: bag.startDate,
    deadline: bag.deadline,
  });

  const status = statusFor(currentValue, proratedNow);

  const span = bag.targetValue - bag.startValue;
  const toPct = (v) => (span === 0 ? 0 : clamp(((v - bag.startValue) / span) * 100, 0, 100));
  const currentPct = toPct(currentValue);
  const proratedPct = toPct(proratedNow);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">The BAG</h2>
          <p className="text-base font-semibold text-primary leading-snug">
            {bag.statement || 'Your big goal'}
          </p>
        </div>
        <StatusLabel status={status} />
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-accent">
          {formatWithUnit(currentValue, bag.unit)}
        </span>
        <span className="text-sm text-muted">
          should be {formatWithUnit(proratedNow, bag.unit)} by now
        </span>
      </div>

      {/* The bar */}
      <div className="relative h-8 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${currentPct}%`, backgroundColor: colors.accent }}
        />
      </div>
      {/* "Should be here today" marker sits above the bar so it isn't clipped */}
      <div className="relative h-5 mt-1">
        <div
          className="absolute -top-8 h-8 border-l-2 border-dashed"
          style={{ left: `${proratedPct}%`, borderColor: colors.primary }}
        />
        <div
          className="absolute text-[10px] font-medium text-primary -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${clamp(proratedPct, 6, 94)}%` }}
        >
          target now
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted mt-1">
        <span>Start: {formatWithUnit(bag.startValue, bag.unit)}</span>
        <span>Goal: {formatWithUnit(bag.targetValue, bag.unit)}</span>
      </div>

      {(updatedByName || nextUpdateDate) && (
        <div className="mt-3 text-xs text-muted">
          {updatedByName ? `Updated by ${updatedByName}` : 'Not updated yet'}
          {nextUpdateDate ? ` · Next: ${nextUpdateDate}` : ''}
        </div>
      )}
    </section>
  );
}
