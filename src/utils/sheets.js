// ============================================================
// All Google Sheets reads/writes for the frontend go through here.
// This module never touches Google directly — it POSTs to the
// serverless function at /api/sheets, which holds the credentials.
//
// Sheet layout (row 1 of every tab is a header row):
//   config            key | value
//   users             user_id | name | username | role | team | pin_hash
//   lead_entries      timestamp | user_id | user_name | team | measure_id | measure_name | value | period
//   lag_entries       timestamp | updated_by | value | period
//   leaderboard_cache period | user_id | user_name | team | lm1_total | lm2_total | combined_score
// ============================================================

const API_URL = '/api/sheets';

// Column headers per tab, used both to read rows into objects and to
// rewrite a tab with a fresh header row.
export const HEADERS = {
  config: ['key', 'value'],
  users: ['user_id', 'name', 'username', 'role', 'team', 'pin_hash'],
  lead_entries: [
    'timestamp',
    'user_id',
    'user_name',
    'team',
    'measure_id',
    'measure_name',
    'value',
    'period',
  ],
  lag_entries: ['timestamp', 'updated_by', 'value', 'period'],
  leaderboard_cache: [
    'period',
    'user_id',
    'user_name',
    'team',
    'lm1_total',
    'lm2_total',
    'combined_score',
  ],
};

async function apiCall(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned a non-JSON response (${res.status}).`);
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data;
}

// --- Low-level range operations -----------------------------------------

export async function readRange(range) {
  const { values } = await apiCall('read', { range });
  return values || [];
}

export async function appendRows(range, rows) {
  return apiCall('append', { range, values: rows });
}

export async function updateRange(range, rows) {
  return apiCall('update', { range, values: rows });
}

export async function clearRange(range) {
  return apiCall('clear', { range });
}

export async function adminLogin(username, pin) {
  const { ok } = await apiCall('adminLogin', { username, pin });
  return !!ok;
}

// --- Helpers ------------------------------------------------------------

// Turn a 2D array of sheet values (excluding the header row) into objects
// keyed by the tab's headers. Pads short rows so missing trailing cells
// (which Google omits) come back as empty strings.
function rowsToObjects(values, keys) {
  if (!values || values.length <= 1) return [];
  return values.slice(1).map((row) => {
    const obj = {};
    keys.forEach((k, i) => {
      obj[k] = row[i] !== undefined && row[i] !== null ? row[i] : '';
    });
    return obj;
  });
}

// --- config tab (key / value) -------------------------------------------

export async function getConfig() {
  const values = await readRange('config!A:B');
  const config = {};
  // Skip the header row; every remaining row is [key, value].
  values.slice(1).forEach((row) => {
    if (row[0]) config[row[0]] = row[1] !== undefined ? row[1] : '';
  });
  return config;
}

// Replace the entire config tab with the given key/value object.
export async function writeConfig(configObj) {
  await clearRange('config!A:B');
  const rows = [HEADERS.config, ...Object.entries(configObj).map(([k, v]) => [k, v ?? ''])];
  await updateRange('config!A1', rows);
}

// Merge a partial set of keys into the existing config (used by the
// admin settings panel so a single edit doesn't wipe everything else).
export async function updateConfig(partial) {
  const current = await getConfig();
  await writeConfig({ ...current, ...partial });
}

// --- users tab ----------------------------------------------------------

export async function getUsers() {
  const values = await readRange('users!A:F');
  return rowsToObjects(values, HEADERS.users);
}

// Overwrite the whole users tab (header + rows). Used by the setup wizard
// Step 3 and by the admin settings user editor.
export async function writeUsers(users) {
  await clearRange('users!A:F');
  const rows = [
    HEADERS.users,
    ...users.map((u) => [
      u.user_id ?? '',
      u.name ?? '',
      u.username ?? '',
      u.role ?? '',
      u.team ?? '',
      u.pin_hash ?? '',
    ]),
  ];
  await updateRange('users!A1', rows);
}

// Set a single user's PIN hash (first-login PIN creation). Finds the user's
// row by scanning the current sheet and updates only their pin_hash cell.
export async function setUserPinHash(userId, pinHash) {
  const values = await readRange('users!A:F');
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === userId) {
      const sheetRow = i + 1; // sheet rows are 1-based
      await updateRange(`users!F${sheetRow}`, [[pinHash]]);
      return true;
    }
  }
  return false;
}

// --- lead_entries tab ---------------------------------------------------

export async function getLeadEntries() {
  const values = await readRange('lead_entries!A:H');
  return rowsToObjects(values, HEADERS.lead_entries);
}

export async function addLeadEntry(entry) {
  const row = HEADERS.lead_entries.map((k) => entry[k] ?? '');
  await appendRows('lead_entries!A:H', [row]);
}

// --- lag_entries tab ----------------------------------------------------

export async function getLagEntries() {
  const values = await readRange('lag_entries!A:D');
  return rowsToObjects(values, HEADERS.lag_entries);
}

export async function addLagEntry(entry) {
  const row = HEADERS.lag_entries.map((k) => entry[k] ?? '');
  await appendRows('lag_entries!A:D', [row]);
}
