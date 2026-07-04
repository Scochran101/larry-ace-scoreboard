import StatusLabel from './StatusLabel.jsx';
import {
  gridPeriods,
  currentPeriodKey,
  periodLabel,
  sumForUserPeriod,
  sumForPeriod,
  statusFor,
  average,
  round,
  formatWithUnit,
} from '../../utils/progress';

// Individual tracking view: names down the left, periods across the top,
// a Team total row, and an average column. Cadence (daily / weekly) drives
// the column headers, the meaning of each cell, the average, and the target
// basis — nothing here is hardcoded to a cadence.
export default function LeadMeasureGrid({ measure, users = [], entries = [], today = new Date() }) {
  const cadence = measure.cadence || 'weekly';
  const target = Number(measure.target) || 0;

  const periods = gridPeriods(cadence, today);
  const currentKey = currentPeriodKey(cadence, today);
  const currentIndex = periods.indexOf(currentKey);
  // If the current period isn't in the shown window, treat all as past.
  const cutoff = currentIndex === -1 ? periods.length - 1 : currentIndex;

  const isFuture = (colIndex) => colIndex > cutoff;

  // Per-user cell values.
  const rows = users.map((u) => {
    const values = periods.map((p) => sumForUserPeriod(entries, u.user_id, measure.id, p));
    const avg = average(values.filter((_, i) => !isFuture(i)));
    return { user: u, values, avg };
  });

  // Team totals per period + team average.
  const teamValues = periods.map((p) => sumForPeriod(entries, measure.id, p));
  const teamAvg = average(teamValues.filter((_, i) => !isFuture(i)));

  // Section status: current-period team total vs the target for everyone.
  const teamCurrent = currentIndex === -1 ? 0 : teamValues[currentIndex];
  const sectionStatus = statusFor(teamCurrent, target * Math.max(users.length, 1));

  const cellClass = (value, colIndex) => {
    if (isFuture(colIndex)) return 'bg-gray-50 text-muted';
    return value >= target && target > 0
      ? 'bg-win/15 text-win-text font-semibold'
      : 'bg-behind/10 text-behind-text';
  };

  const headClass = (colIndex) =>
    colIndex === currentIndex
      ? 'text-primary font-bold'
      : 'text-muted font-medium';

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <SectionHeader measure={measure} status={sectionStatus} />

      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 font-semibold text-text sticky left-0 bg-white">
                Name
              </th>
              {periods.map((p, i) => (
                <th key={p} className={`px-2 py-2 text-center ${headClass(i)}`}>
                  {periodLabel(cadence, p)}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-text">Avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={periods.length + 2} className="py-4 text-center text-muted">
                  No team members yet.
                </td>
              </tr>
            )}
            {rows.map(({ user, values, avg }) => (
              <tr key={user.user_id} className="border-t border-gray-100">
                <td className="py-1.5 pr-3 text-text sticky left-0 bg-white whitespace-nowrap">
                  {user.name || user.username}
                </td>
                {values.map((v, i) => (
                  <td key={i} className="px-1 py-1">
                    <div className={`rounded-md text-center py-1.5 ${cellClass(v, i)}`}>
                      {isFuture(i) ? '' : round(v, 0)}
                    </div>
                  </td>
                ))}
                <td className="px-2 py-1 text-center font-semibold text-text">{round(avg)}</td>
              </tr>
            ))}
            {/* Team total row */}
            <tr className="border-t-2 border-gray-200">
              <td className="py-2 pr-3 font-bold text-primary sticky left-0 bg-white">
                Team total
              </td>
              {teamValues.map((v, i) => (
                <td key={i} className="px-2 py-2 text-center font-bold text-text">
                  {isFuture(i) ? '' : round(v, 0)}
                </td>
              ))}
              <td className="px-2 py-2 text-center font-bold text-primary">{round(teamAvg)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">
        Target: {formatWithUnit(target, measure.unit)} per person, per{' '}
        {cadence === 'daily' ? 'day' : 'week'}. Green = at or above target, red = below.
      </p>
    </section>
  );
}

function SectionHeader({ measure, status }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Lead measure
        </h2>
        <p className="text-base font-semibold text-primary leading-snug">
          {measure.name || 'Lead measure'}
        </p>
      </div>
      <StatusLabel status={status} />
    </div>
  );
}
