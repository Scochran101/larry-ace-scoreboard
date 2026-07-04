import { STATUS_LABELS } from '../../utils/progress';

// The winning / at risk / behind pill shown in the top-right of each
// scoreboard section. Colors come from the fixed status palette.
const STYLES = {
  winning: 'bg-win/15 text-win-text',
  atrisk: 'bg-atrisk/15 text-atrisk-text',
  behind: 'bg-behind/15 text-behind-text',
};

const DOT = {
  winning: 'bg-win',
  atrisk: 'bg-atrisk',
  behind: 'bg-behind',
};

export default function StatusLabel({ status }) {
  const s = STATUS_LABELS[status] ? status : 'behind';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${STYLES[s]}`}
    >
      <span className={`h-2 w-2 rounded-full ${DOT[s]}`} />
      {STATUS_LABELS[s]}
    </span>
  );
}
