import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
  Tooltip,
} from 'recharts';
import StatusLabel from './StatusLabel.jsx';
import { useBrandColors } from '../../utils/theme';
import {
  gridPeriods,
  currentPeriodKey,
  periodLabel,
  sumForPeriod,
  statusFor,
  round,
  formatWithUnit,
} from '../../utils/progress';

// Aggregate tracking view: one bar per period, a dashed target line, bars at
// or above target in green and below-target bars in grey. Period labels are
// centered under each bar; counts are centered on top of each bar.
export default function LeadMeasureBarChart({ measure, entries = [], today = new Date() }) {
  const colors = useBrandColors();
  const cadence = measure.cadence || 'weekly';
  const target = Number(measure.target) || 0;

  const periods = gridPeriods(cadence, today);
  const currentKey = currentPeriodKey(cadence, today);
  const currentLabel = periodLabel(cadence, currentKey);

  const data = periods.map((p) => ({
    label: periodLabel(cadence, p),
    key: p,
    value: sumForPeriod(entries, measure.id, p),
    isCurrent: p === currentKey,
  }));

  const currentValue = data.find((d) => d.isCurrent)?.value ?? 0;
  const sectionStatus = statusFor(currentValue, target);

  // X-axis tick that emphasizes the current period's label in the primary color.
  const AxisTick = ({ x, y, payload }) => {
    const isCurrent = payload.value === currentLabel;
    return (
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        fontSize={12}
        fontWeight={isCurrent ? 700 : 500}
        fill={isCurrent ? colors.primary : colors.muted}
      >
        {payload.value}
      </text>
    );
  };

  const countLabel = (props) => {
    const { x, y, width, value } = props;
    if (!value) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 6}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill={colors.text}
      >
        {round(value, 0)}
      </text>
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Lead measure
          </h2>
          <p className="text-base font-semibold text-primary leading-snug">
            {measure.name || 'Lead measure'}
          </p>
        </div>
        <StatusLabel status={sectionStatus} />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
            <XAxis dataKey="label" tick={<AxisTick />} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: colors.muted }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              formatter={(value) => [formatWithUnit(value, measure.unit), measure.name || 'Total']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            {target > 0 && (
              <ReferenceLine
                y={target}
                stroke={colors.primary}
                strokeDasharray="6 6"
                strokeWidth={2}
                label={{
                  value: `Target ${formatWithUnit(target, measure.unit)}`,
                  position: 'right',
                  fontSize: 11,
                  fill: colors.primary,
                }}
              />
            )}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={target > 0 && d.value >= target ? colors.winFill : colors.muted}
                />
              ))}
              <LabelList dataKey="value" content={countLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted">
        Target: {formatWithUnit(target, measure.unit)} per {cadence === 'daily' ? 'day' : 'week'}.
        Bars at or above target are green; below-target bars are grey.
      </p>
    </section>
  );
}
