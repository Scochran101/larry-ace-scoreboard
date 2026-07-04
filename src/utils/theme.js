// ============================================================
// Reads the brand + status colors so that JavaScript charts (Recharts,
// which render SVG attributes and cannot resolve CSS var() references)
// get real hex values.
//
// IMPORTANT: this file DEFINES nothing. Every color originates in the
// BRAND / FIXED blocks at the top of tailwind.config.js, which mirrors
// them onto :root as CSS custom properties. This module only reads those
// resolved values back out. To change a color, edit tailwind.config.js.
// ============================================================

import { useState, useEffect } from 'react';

const VAR_NAMES = {
  primary: '--brand-primary',
  accent: '--brand-accent',
  background: '--brand-background',
  text: '--color-text',
  muted: '--color-muted',
  winFill: '--win-fill',
  winText: '--win-text',
  behindFill: '--behind-fill',
  behindText: '--behind-text',
  atRiskFill: '--atrisk-fill',
  atRiskText: '--atrisk-text',
  targetLine: '--target-line',
};

export function getBrandColors() {
  const colors = {};
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return colors;
  }
  const styles = getComputedStyle(document.documentElement);
  Object.entries(VAR_NAMES).forEach(([key, cssVar]) => {
    colors[key] = styles.getPropertyValue(cssVar).trim();
  });
  return colors;
}

// React hook — returns the resolved color map, refreshed once on mount so
// values are present even if the stylesheet loaded a tick late.
export function useBrandColors() {
  const [colors, setColors] = useState(() => getBrandColors());
  useEffect(() => {
    setColors(getBrandColors());
  }, []);
  return colors;
}

// Map a status ('winning' | 'atrisk' | 'behind') to its fill/text colors.
export function statusColors(colors, status) {
  switch (status) {
    case 'winning':
      return { fill: colors.winFill, text: colors.winText };
    case 'atrisk':
      return { fill: colors.atRiskFill, text: colors.atRiskText };
    default:
      return { fill: colors.behindFill, text: colors.behindText };
  }
}
