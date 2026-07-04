// ============================================================
// Reads the live configuration from the Google Sheet `config` tab and
// turns the flat key/value pairs into a structured object the rest of the
// app uses. Ships EMPTY — no client data is hardcoded here. Every value
// originates from the setup wizard and lives in the Sheet.
// ============================================================

import { getConfig as readRawConfig, writeConfig } from './sheets';

// The exact set of keys stored in the `config` tab (see CLAUDE.md).
export const CONFIG_KEYS = [
  'setup_complete',
  'client_name',
  'bag_statement',
  'bag_unit',
  'bag_start_value',
  'bag_target_value',
  'bag_start_date',
  'bag_deadline',
  'bag_lag_cadence',
  'scoreboard_view',
  'lm1_name',
  'lm1_description',
  'lm1_unit',
  'lm1_target',
  'lm1_cadence',
  'lm1_entered_by',
  'lm2_name',
  'lm2_description',
  'lm2_unit',
  'lm2_target',
  'lm2_cadence',
  'lm2_entered_by',
  'scoreboard_style',
  'tracking_mode',
];

function num(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// Fetch and parse the config from the Sheet into a structured object.
export async function loadConfig() {
  const raw = await readRawConfig();
  return parseConfig(raw);
}

export function parseConfig(raw = {}) {
  const trackingMode =
    raw.tracking_mode ||
    (raw.scoreboard_view === 'individual' ? 'individual' : 'aggregate');

  const leadMeasure = (n) => ({
    id: `lm${n}`,
    name: raw[`lm${n}_name`] || '',
    description: raw[`lm${n}_description`] || '',
    unit: raw[`lm${n}_unit`] || '',
    target: num(raw[`lm${n}_target`]),
    cadence: raw[`lm${n}_cadence`] || 'weekly', // 'daily' | 'weekly'
    enteredBy: raw[`lm${n}_entered_by`] || 'team', // 'team' | 'admin' | 'both'
  });

  return {
    raw,
    setupComplete: String(raw.setup_complete).toLowerCase() === 'true',
    clientName: raw.client_name || '',
    bag: {
      statement: raw.bag_statement || '',
      unit: raw.bag_unit || '',
      startValue: num(raw.bag_start_value),
      targetValue: num(raw.bag_target_value),
      // Auto-set to the date setup was completed (the goal's start date).
      startDate: raw.bag_start_date || '',
      deadline: raw.bag_deadline || '',
      lagCadence: raw.bag_lag_cadence || 'weekly', // 'weekly' | 'monthly'
    },
    scoreboardView: raw.scoreboard_view || 'team_total', // 'team_total' | 'individual'
    trackingMode, // 'aggregate' | 'individual'
    scoreboardStyle: raw.scoreboard_style || 'trend_chart', // 'trend_chart' | 'progress_bars'
    leadMeasures: [leadMeasure(1), leadMeasure(2)],
  };
}

export function isSetupComplete(config) {
  if (!config) return false;
  return config.setupComplete === true;
}

// Convert the wizard's structured state back into flat key/value pairs and
// persist to the Sheet. `setupComplete` and `scoreboardStyle` can be passed
// explicitly (Step 4 sets them on finish).
export function buildConfigKeyValues(wizard) {
  const lm = (i) => wizard.leadMeasures?.[i] || {};
  return {
    setup_complete: wizard.setupComplete ? 'true' : 'false',
    client_name: wizard.clientName || '',
    bag_statement: wizard.bag?.statement || '',
    bag_unit: wizard.bag?.unit || '',
    bag_start_value: wizard.bag?.startValue ?? '',
    bag_target_value: wizard.bag?.targetValue ?? '',
    bag_start_date: wizard.bag?.startDate || '',
    bag_deadline: wizard.bag?.deadline || '',
    bag_lag_cadence: wizard.bag?.lagCadence || 'weekly',
    scoreboard_view: wizard.scoreboardView || 'team_total',
    tracking_mode:
      wizard.trackingMode ||
      (wizard.scoreboardView === 'individual' ? 'individual' : 'aggregate'),
    lm1_name: lm(0).name || '',
    lm1_description: lm(0).description || '',
    lm1_unit: lm(0).unit || '',
    lm1_target: lm(0).target ?? '',
    lm1_cadence: lm(0).cadence || 'weekly',
    lm1_entered_by: lm(0).enteredBy || 'team',
    lm2_name: lm(1).name || '',
    lm2_description: lm(1).description || '',
    lm2_unit: lm(1).unit || '',
    lm2_target: lm(1).target ?? '',
    lm2_cadence: lm(1).cadence || 'weekly',
    lm2_entered_by: lm(1).enteredBy || 'team',
    scoreboard_style: wizard.scoreboardStyle || 'trend_chart',
  };
}

// Persist the structured wizard state to the Sheet in one write.
export async function saveConfig(wizard) {
  await writeConfig(buildConfigKeyValues(wizard));
}

// Build a wizard state from the raw config, leaving anything not yet saved
// BLANK (no non-empty defaults). Used to resume an interrupted setup — a
// fresh install produces the same all-empty state as EMPTY_WIZARD_STATE.
export function wizardFromRaw(raw = {}) {
  return {
    setupComplete: false,
    clientName: raw.client_name || '',
    bag: {
      statement: raw.bag_statement || '',
      unit: raw.bag_unit || '',
      startValue: raw.bag_start_value ?? '',
      targetValue: raw.bag_target_value ?? '',
      startDate: raw.bag_start_date || '',
      deadline: raw.bag_deadline || '',
      lagCadence: raw.bag_lag_cadence || '',
    },
    scoreboardView: raw.scoreboard_view || '',
    trackingMode: raw.tracking_mode || '',
    scoreboardStyle: raw.scoreboard_style || '',
    leadMeasures: [
      {
        id: 'lm1',
        name: raw.lm1_name || '',
        description: raw.lm1_description || '',
        unit: raw.lm1_unit || '',
        target: raw.lm1_target ?? '',
        cadence: raw.lm1_cadence || '',
        enteredBy: raw.lm1_entered_by || '',
      },
      {
        id: 'lm2',
        name: raw.lm2_name || '',
        description: raw.lm2_description || '',
        unit: raw.lm2_unit || '',
        target: raw.lm2_target ?? '',
        cadence: raw.lm2_cadence || '',
        enteredBy: raw.lm2_entered_by || '',
      },
    ],
  };
}

// A blank wizard state — everything empty. This is what Setup Mode starts
// from. No placeholder/example data (per the non-negotiable rules).
export const EMPTY_WIZARD_STATE = {
  setupComplete: false,
  clientName: '',
  bag: {
    statement: '',
    unit: '',
    startValue: '',
    targetValue: '',
    startDate: '',
    deadline: '',
    lagCadence: '',
  },
  scoreboardView: '',
  trackingMode: '',
  scoreboardStyle: '',
  leadMeasures: [
    { id: 'lm1', name: '', description: '', unit: '', target: '', cadence: '', enteredBy: '' },
    { id: 'lm2', name: '', description: '', unit: '', target: '', cadence: '', enteredBy: '' },
  ],
};
