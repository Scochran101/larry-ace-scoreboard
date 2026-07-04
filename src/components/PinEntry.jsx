import { useRef } from 'react';

// A 4-digit PIN input: four boxes with auto-advance and backspace handling.
// `value` is a string of up to 4 digits; `onChange` receives the new string;
// `onComplete` fires when the fourth digit is entered.
export default function PinEntry({ value = '', onChange, onComplete, autoFocus = true, label }) {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const digits = value.padEnd(4, ' ').slice(0, 4).split('');

  function setDigit(index, digit) {
    const arr = value.padEnd(4, ' ').slice(0, 4).split('');
    arr[index] = digit;
    const next = arr.join('').replace(/\s/g, '');
    onChange(next);
    return next;
  }

  function handleChange(index, e) {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) return;
    const digit = raw[raw.length - 1];
    const next = setDigit(index, digit);
    if (index < 3) refs[index + 1].current?.focus();
    if (next.length === 4 && onComplete) onComplete(next);
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.padEnd(4, ' ').slice(0, 4).split('');
      if (arr[index] && arr[index] !== ' ') {
        arr[index] = '';
      } else if (index > 0) {
        arr[index - 1] = '';
        refs[index - 1].current?.focus();
      }
      onChange(arr.join('').replace(/\s/g, ''));
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-text mb-2">{label}</label>}
      <div className="flex gap-3 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            value={d.trim()}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-14 h-16 text-center text-2xl font-semibold rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        ))}
      </div>
    </div>
  );
}
