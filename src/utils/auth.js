// ============================================================
// Auth: username + 4-digit PIN, role-based, session in localStorage.
//
// PINs are never stored in plain text. On first login a user chooses a
// PIN; we store only its SHA-256 hash (salted with the username) in the
// `users` tab. The raw PIN never leaves the browser.
//
// Bootstrap: before any users exist, the starter admin defined in the
// environment variables (ADMIN_USERNAME / ADMIN_PIN) can log in. That
// check happens server-side in /api/sheets (action: adminLogin).
// ============================================================

import {
  getUsers,
  writeUsers,
  setUserPinHash,
  adminLogin,
} from './sheets';

const SESSION_KEY = 'bag_scoreboard_session';

// --- PIN hashing (Web Crypto, SHA-256) ----------------------------------

export async function hashPin(username, pin) {
  const salted = `${String(username).trim().toLowerCase()}:${String(pin)}`;
  const bytes = new TextEncoder().encode(salted);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

// --- Session -----------------------------------------------------------

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user) {
  const safe = {
    user_id: user.user_id || '',
    name: user.name || '',
    username: user.username || '',
    role: user.role || 'team_member',
    team: user.team || '',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
  return safe;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAdmin(user) {
  return !!user && user.role === 'admin';
}

// Normalize the role values used across the app. The users tab stores
// 'admin' or 'team_member'.
export function normalizeRole(role) {
  return role === 'admin' ? 'admin' : 'team_member';
}

// --- Login -------------------------------------------------------------

// Attempts a login. Returns one of:
//   { status: 'ok', user }             -> logged in, session set
//   { status: 'set_pin', user }        -> known user, no PIN yet (first login)
//   { status: 'bootstrap_admin', username } -> starter admin, needs to set a PIN
// Throws Error('Incorrect username or PIN.') on failure.
export async function login(username, pin) {
  const uname = String(username).trim();
  const users = await getUsers();
  const match = users.find(
    (u) => (u.username || '').trim().toLowerCase() === uname.toLowerCase()
  );

  if (match) {
    if (match.pin_hash) {
      const hash = await hashPin(match.username, pin);
      if (hash === match.pin_hash) {
        const user = { ...match, role: normalizeRole(match.role) };
        setSession(user);
        return { status: 'ok', user };
      }
      throw new Error('Incorrect username or PIN.');
    }
    // Known user with no PIN yet -> first login, must set one.
    return { status: 'set_pin', user: match };
  }

  // No matching user. Fall back to the starter admin credentials.
  const ok = await adminLogin(uname, pin);
  if (ok) {
    return { status: 'bootstrap_admin', username: uname };
  }

  throw new Error('Incorrect username or PIN.');
}

// Complete a first-login PIN creation for an existing user row.
export async function setPinForUser(user, pin) {
  const hash = await hashPin(user.username, pin);
  await setUserPinHash(user.user_id, hash);
  const updated = { ...user, pin_hash: hash, role: normalizeRole(user.role) };
  setSession(updated);
  return updated;
}

// Create the very first admin user (from the starter env credentials) with
// the PIN they just chose, then log them in. Runs before the setup wizard.
export async function createBootstrapAdmin(username, pin) {
  const existing = await getUsers();
  const already = existing.find(
    (u) => (u.username || '').trim().toLowerCase() === username.trim().toLowerCase()
  );

  let adminUser;
  if (already) {
    adminUser = { ...already, role: 'admin' };
    adminUser.pin_hash = await hashPin(adminUser.username, pin);
    const merged = existing.map((u) =>
      u.user_id === adminUser.user_id ? adminUser : u
    );
    await writeUsers(merged);
  } else {
    adminUser = {
      user_id: newId(),
      name: username,
      username,
      role: 'admin',
      team: '',
      pin_hash: await hashPin(username, pin),
    };
    await writeUsers([...existing, adminUser]);
  }

  setSession(adminUser);
  return adminUser;
}
