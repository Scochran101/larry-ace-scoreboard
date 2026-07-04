import plugin from 'tailwindcss/plugin';

// ============================================================
// BRAND COLORS — change these three values per client, then
// commit and push. Vercel redeploys automatically. Do not
// edit colors anywhere else in the codebase.
// ============================================================
const BRAND = {
  primary:    '#e82d34',  // Ace Hardware red — headers, primary buttons, BAG chart target line
  accent:     '#000000',  // Ace black — BAG actual line, log button, highlights
  background: '#FFFFFF',  // page background
};

// ------------------------------------------------------------
// FIXED PALETTE — these do NOT change per client. They are the
// shared status/text colors used across every scoreboard. Leave
// them alone; only the three BRAND values above are client knobs.
// ------------------------------------------------------------
const FIXED = {
  text:        '#2C2C2A',  // body text
  muted:       '#9d9d94',  // muted / grey supporting text
  winFill:     '#22c55e',  // winning — fills (bars, cells)
  winText:     '#15803d',  // winning — text on a light background
  behindFill:  '#ef4444',  // behind — fills
  behindText:  '#dc2626',  // behind — text on a light background
  atRiskFill:  '#f59e0b',  // at risk — fills
  atRiskText:  '#b45309',  // at risk — text on a light background
  targetLine:  '#d1d5db',  // dashed grey target line on the BAG chart
};

// Every value above is mirrored into CSS custom properties on :root so
// that JavaScript charts (Recharts) can read the *resolved* hex value at
// runtime via getComputedStyle (see src/utils/theme.js). This keeps this
// file the single source of truth for color — theme.js only READS it.
const cssVars = {
  '--brand-primary': BRAND.primary,
  '--brand-accent': BRAND.accent,
  '--brand-background': BRAND.background,
  '--color-text': FIXED.text,
  '--color-muted': FIXED.muted,
  '--win-fill': FIXED.winFill,
  '--win-text': FIXED.winText,
  '--behind-fill': FIXED.behindFill,
  '--behind-text': FIXED.behindText,
  '--atrisk-fill': FIXED.atRiskFill,
  '--atrisk-text': FIXED.atRiskText,
  '--target-line': FIXED.targetLine,
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: BRAND.primary,
        accent: BRAND.accent,
        background: BRAND.background,
        text: FIXED.text,
        muted: FIXED.muted,
        win: { DEFAULT: FIXED.winFill, text: FIXED.winText },
        behind: { DEFAULT: FIXED.behindFill, text: FIXED.behindText },
        atrisk: { DEFAULT: FIXED.atRiskFill, text: FIXED.atRiskText },
        targetline: FIXED.targetLine,
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVars });
    }),
  ],
};
