// ============================================================
// Vercel serverless function — the ONLY place that talks to the
// Google Sheets API. The React frontend never calls Google directly;
// it POSTs to /api/sheets and this function does the work using the
// service-account credentials stored in environment variables.
//
// Supported actions (POST JSON body: { action, ... }):
//   read       { range }                  -> { values }
//   append     { range, values }          -> { updates }
//   update     { range, values }          -> { updatedCells }
//   clear      { range }                  -> { cleared }
//   adminLogin { username, pin }          -> { ok }   (checks env starter creds)
//
// "range" uses A1 notation with the tab name, e.g. "config!A:B".
// ============================================================

import { google } from 'googleapis';

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Vercel stores the private key with literal "\n" sequences; turn them
  // back into real newlines so Google can parse the PEM key.
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY environment variables.'
    );
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Vercel usually parses JSON bodies automatically; fall back just in case.
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }
  }
  body = body || {};

  const { action } = body;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // --- Admin bootstrap login: verify the starter admin credentials that
    // --- live in environment variables (used before any users exist). ---
    if (action === 'adminLogin') {
      const { username, pin } = body;
      const ok =
        !!process.env.ADMIN_USERNAME &&
        !!process.env.ADMIN_PIN &&
        String(username).trim().toLowerCase() ===
          String(process.env.ADMIN_USERNAME).trim().toLowerCase() &&
        String(pin) === String(process.env.ADMIN_PIN);
      return res.status(200).json({ ok });
    }

    if (!spreadsheetId) {
      return res
        .status(500)
        .json({ error: 'Missing GOOGLE_SHEET_ID environment variable.' });
    }

    const sheets = getSheetsClient();

    if (action === 'read') {
      const { range } = body;
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return res.status(200).json({ values: result.data.values || [] });
    }

    if (action === 'append') {
      const { range, values } = body;
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });
      return res.status(200).json({ updates: result.data.updates || {} });
    }

    if (action === 'update') {
      const { range, values } = body;
      const result = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
      return res.status(200).json({ updatedCells: result.data.updatedCells || 0 });
    }

    if (action === 'clear') {
      const { range } = body;
      await sheets.spreadsheets.values.clear({ spreadsheetId, range });
      return res.status(200).json({ cleared: true });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    // Surface a readable message; Google errors are often nested.
    const message =
      err?.errors?.[0]?.message || err?.message || 'Unknown Google Sheets error.';
    return res.status(500).json({ error: message });
  }
}
