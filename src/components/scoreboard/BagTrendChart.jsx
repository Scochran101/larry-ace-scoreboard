import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import StatusLabel from './StatusLabel.jsx';
import { useBrandColors } from '../../utils/theme';
import { buildBagSeries, statusFor, formatWithUnit } from '../../utils/progress';

// Section 1 of the scoreboard: the BAG as a trend chart.
// - Target line: straight diagonal, dashed grey.
// - Actual line: bold, bright accent color (never navy), the most visible
//   element in the chart, with a filled dot at the current point.
export default function BagTrendChart({ bag, lagEntries = [], updatedByName, nextUpdateDate }) {
  const colors = useBrandColors();

  const { series, currentValue, proratedNow } = buildBagSeries({
    startValue: bag.startValue,
    targetValue: bag.targetValue,
    startDate: bag.startDate,
    deadline: bag.deadline,
    lagEntries,
    lagCadence: bag.lagCadence,
  });

  const status = statusFor(currentValue, proratedNow);

  // Index of the last known actual point (where the "current" label sits).
  let lastActualIndex = -1;
  series.forEach((p, i) => {
    if (p.actual !== null && p.actual !== undefined) lastActualIndex = i;
  });

  const CurrentLabel = (props) => {
    const { x, y, index, value } = props;
    if (index !== lastActualIndex || value === null || value === undefined) return null;
    return (
      <text x={x} y={y - 12} textAnchor="middle" fontSize={13} fontWeight={700} fill={colors.accent}>
        {formatWithUnit(value, bag.unit)}
      </text>
    );
  };

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

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-accent">
          {formatWithUnit(currentValue, bag.unit)}
        </span>
        <span className="text-sm text-muted">
          should be {formatWithUnit(proratedNow, bag.unit)} by now
        </span>
      </div>

      {series.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-muted text-sm">
          Add a start date, deadline, start value and target to see the trend.
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 18, right: 24, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: colors.muted }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.muted }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value, name) => [formatWithUnit(value, bag.unit), name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              {/* Target diagonal — dashed grey, behind the actual line. */}
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke={colors.targetLine}
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
                isAnimationActive={false}
              />
              {/* Actual — bright accent, heaviest line, filled dot at current. */}
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={colors.accent}
                strokeWidth={3}
                connectNulls
                dot={{ r: 3, fill: colors.accent, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                label={CurrentLabel}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend + update note */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1 w-5 rounded" style={{ backgroundColor: colors.accent }} />
            Actual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0 w-5 border-t-2 border-dashed"
              style={{ borderColor: colors.targetLine }}
            />
            Target
          </span>
        </div>
        {(updatedByName || nextUpdateDate) && (
          <span>
            {updatedByName ? `Updated by ${updatedByName}` : 'Not updated yet'}
            {nextUpdateDate ? ` · Next: ${nextUpdateDate}` : ''}
          </span>
        )}
      </div>
    </section>
  );
}
