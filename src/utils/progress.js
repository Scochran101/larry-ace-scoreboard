// ============================================================
// Progress math — prorated targets, status thresholds, period keys,
// aggregation, and the BAG trend series. Every scoreboard component and
// the admin settings panel share this one module so the numbers are
// always consistent.
//
// Cadence is honored everywhere: nothing here assumes daily or weekly.
// The caller passes the stored cadence and this module branches on it.
// ============================================================

// --- Small helpers ------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Parse 'YYYY-MM-DD' into a local Date at midnight. Returns null if invalid.
export function parseDate(str) {
  if (!str) return null;
  if (str instanceof Date) return str;
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysBetween(a, b) {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((end - start) / DAY_MS);
}

// --- ISO week + period keys --------------------------------------------

// ISO-8601 week number and week-year for a date.
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // move to the Thursday of this week
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * DAY_MS));
  return { year: d.getUTCFullYear(), week };
}

export function weekKey(date) {
  const { year, week } = isoWeek(date);
  return `${year}-W${pad(week)}`;
}

export function monthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

// The Monday that begins the week containing `date`.
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNum = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - dayNum);
  return d;
}

// The period key a value would be filed under for a given cadence + date.
// Used when a team member submits, and when reading entries back.
export function currentPeriodKey(cadence, date = new Date()) {
  if (cadence === 'daily') return dateKey(date);
  if (cadence === 'monthly') return monthKey(date);
  return weekKey(date); // weekly (default)
}

// A short human label for a period key, given its cadence.
export function periodLabel(cadence, key) {
  if (!key) return '';
  if (cadence === 'daily') {
    const d = parseDate(key);
    return d ? WEEKDAYS[d.getDay()] : key;
  }
  if (cadence === 'monthly') {
    const m = String(key).match(/^(\d{4})-(\d{2})$/);
    return m ? MONTHS[Number(m[2]) - 1] : key;
  }
  // weekly: '2026-W27' -> 'W27'
  const m = String(key).match(/W(\d{1,2})$/);
  return m ? `W${Number(m[1])}` : key;
}

// The list of period keys shown as columns in the lead-measure grid.
//   daily  -> Mon..Sun of the current week (7 columns)
//   weekly -> the last `count` weeks ending this week (default 6)
export function gridPeriods(cadence, today = new Date(), count = 6) {
  if (cadence === 'daily') {
    const monday = mondayOf(today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return dateKey(d);
    });
  }
  // weekly
  const thisMonday = mondayOf(today);
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(thisMonday);
    d.setDate(thisMonday.getDate() - i * 7);
    keys.push(weekKey(d));
  }
  return keys;
}

// --- Prorated target + status ------------------------------------------

// Where the team SHOULD be today given a straight line from start to target.
export function proratedTarget({ startValue, targetValue, startDate, deadline, today = new Date() }) {
  const start = parseDate(startDate);
  const end = parseDate(deadline);
  if (!start || !end) return targetValue;
  const total = daysBetween(start, end);
  if (total <= 0) return targetValue;
  const elapsed = clamp(daysBetween(start, today), 0, total);
  return startValue + (targetValue - startValue) * (elapsed / total);
}

// Status of an actual value against the target-for-now.
// Returns 'winning' | 'atrisk' | 'behind'.
export function statusFor(current, targetForNow) {
  const c = Number(current) || 0;
  const t = Number(targetForNow) || 0;
  if (t <= 0) return c > 0 ? 'winning' : 'behind';
  if (c >= t) return 'winning';
  if (c >= t * 0.9) return 'atrisk';
  return 'behind';
}

export const STATUS_LABELS = {
  winning: 'Winning',
  atrisk: 'At risk',
  behind: 'Behind',
};

// --- Aggregation of lead entries ---------------------------------------

// Sum of a measure's values in one period (all users).
export function sumForPeriod(entries, measureId, periodKey) {
  return entries
    .filter((e) => e.measure_id === measureId && e.period === periodKey)
    .reduce((acc, e) => acc + (parseFloat(e.value) || 0), 0);
}

// Sum of one user's values for a measure in one period.
export function sumForUserPeriod(entries, userId, measureId, periodKey) {
  return entries
    .filter(
      (e) =>
        e.user_id === userId &&
        e.measure_id === measureId &&
        e.period === periodKey
    )
    .reduce((acc, e) => acc + (parseFloat(e.value) || 0), 0);
}

// Average of a set of per-period numbers (ignores periods with no data by
// default so early empty columns don't drag the average down).
export function average(nums, includeEmpty = false) {
  const list = includeEmpty ? nums : nums.filter((n) => n > 0);
  if (list.length === 0) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

// --- BAG trend series (target diagonal + actual line) ------------------

// Build the list of period points spanning the goal timeline for the BAG
// chart, based on the lag cadence (weekly or monthly).
function bagPeriodPoints(startDate, deadline, lagCadence) {
  const points = [];
  const start = parseDate(startDate);
  const end = parseDate(deadline);
  if (!start || !end || end <= start) return points;

  if (lagCadence === 'monthly') {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last) {
      points.push({
        date: new Date(cursor),
        key: monthKey(cursor),
        label: MONTHS[cursor.getMonth()],
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    // weekly
    const cursor = mondayOf(start);
    const last = mondayOf(end);
    while (cursor <= last) {
      points.push({
        date: new Date(cursor),
        key: weekKey(cursor),
        label: periodLabel('weekly', weekKey(cursor)),
      });
      cursor.setDate(cursor.getDate() + 7);
    }
  }
  return points;
}

// Returns { series, currentValue, proratedNow } where series is an array of
// { label, target, actual } for the chart. `actual` is null for periods with
// no lag entry yet (the chart connects across gaps).
export function buildBagSeries({
  startValue,
  targetValue,
  startDate,
  deadline,
  lagEntries = [],
  lagCadence = 'weekly',
  today = new Date(),
}) {
  const points = bagPeriodPoints(startDate, deadline, lagCadence);
  if (points.length === 0) {
    return { series: [], currentValue: startValue, proratedNow: startValue };
  }

  // Latest lag value per period key.
  const latestByPeriod = {};
  const ordered = [...lagEntries].sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp))
  );
  ordered.forEach((e) => {
    if (e.period) latestByPeriod[e.period] = parseFloat(e.value);
  });

  let currentValue = startValue;
  const series = points.map((p, i) => {
    const target = proratedTarget({
      startValue,
      targetValue,
      startDate,
      deadline,
      today: p.date,
    });
    let actual = null;
    if (i === 0) {
      // The line begins at the start value on the start date.
      actual = startValue;
    } else if (latestByPeriod[p.key] !== undefined && !Number.isNaN(latestByPeriod[p.key])) {
      actual = latestByPeriod[p.key];
    }
    if (actual !== null) currentValue = actual;
    return { label: p.label, target: round(target), actual: actual === null ? null : round(actual) };
  });

  // Force the final point's target to land exactly on the goal target.
  series[series.length - 1].target = round(targetValue);

  const proratedNow = proratedTarget({ startValue, targetValue, startDate, deadline, today });
  return { series, currentValue, proratedNow: round(proratedNow) };
}

// --- Formatting --------------------------------------------------------

export function round(n, dp = 1) {
  const f = Math.pow(10, dp);
  return Math.round((Number(n) || 0) * f) / f;
}

// Render a value with its unit. Percentage units render as "42%"; count and
// rate units render as "42 customers per day".
export function formatWithUnit(value, unit) {
  const v = round(value);
  const u = (unit || '').trim();
  if (u === '%' || /percent|percentage/i.test(u)) return `${v}%`;
  return u ? `${v} ${u}` : `${v}`;
}
