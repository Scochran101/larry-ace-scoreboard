# BAG Scoreboard

A configurable team scoreboard. It shows a big goal (the **BAG**), the weekly or daily behaviors that drive it (the **lead measures**), and whether the team is winning or losing — at a glance.

This app ships **blank**. You deploy it once per client, then the client's admin fills in everything through an in-app setup wizard. No code changes are needed to configure a new client — only the three brand colors (see [Changing the brand colors](#8-changing-the-brand-colors)).

---

## 1. What this app is

A single web app a team logs into to track one big goal and the daily/weekly actions that move it. An admin configures the goal, the measures, and the team through a 4-step wizard; team members log their numbers from their phones; everyone sees a live scoreboard.

---

## 2. What you need before you start

All free. Create these accounts first if you don't have them.

- **A Google account** — <https://accounts.google.com>
- **Access to Google Cloud Console** — <https://console.cloud.google.com> (sign in with the Google account)
- **A GitHub account** — <https://github.com/join>
- **GitHub Desktop** (so you never touch a command line) — <https://desktop.github.com>
- **A Vercel account** — <https://vercel.com/signup> (choose "Continue with GitHub")

You'll also download this project's code as a folder on your computer.

---

## 3. Step 1 — Create the Google Sheet

The app stores all its data in one Google Sheet with five tabs.

1. Go to <https://sheets.google.com> and click the **+ Blank** spreadsheet.
2. Name it (top-left), e.g. **"Acme Scoreboard Data"**.
3. At the bottom, you'll see one tab named `Sheet1`. You need **five** tabs with these **exact** names (lowercase, with underscores). Double-click a tab to rename it, and use the **+** at the bottom-left to add more:
   - `config`
   - `users`
   - `lead_entries`
   - `lag_entries`
   - `leaderboard_cache`
4. In **row 1** of each tab, type these column headers, one per cell across the top. They must match exactly.

   **`config`** (this tab is a simple key/value list — the app fills the rows in itself):
   | A | B |
   |---|---|
   | key | value |

   **`users`**:
   | A | B | C | D | E | F |
   |---|---|---|---|---|---|
   | user_id | name | username | role | team | pin_hash |

   **`lead_entries`**:
   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | timestamp | user_id | user_name | team | measure_id | measure_name | value | period |

   **`lag_entries`**:
   | A | B | C | D |
   |---|---|---|---|
   | timestamp | updated_by | value | period |

   **`leaderboard_cache`**:
   | A | B | C | D | E | F | G |
   |---|---|---|---|---|---|---|
   | period | user_id | user_name | team | lm1_total | lm2_total | combined_score |

5. **Copy the Sheet ID.** Look at the address bar. The URL looks like:
   `https://docs.google.com/spreadsheets/d/`**`1A2b3C4d5E6f7G8h9I0j`**`/edit#gid=0`
   The bold part between `/d/` and `/edit` is your **Sheet ID**. Copy it somewhere safe — you'll need it in Step 4.

---

## 4. Step 2 — Set up Google Cloud (so the app can read/write your Sheet)

The app signs in to Google as a "service account" — a robot user with its own email. You'll create it, download its key, and share the Sheet with it.

1. Go to <https://console.cloud.google.com>.
2. At the top, click the project dropdown → **New Project**. Name it (e.g. "Acme Scoreboard") → **Create**. Wait a few seconds, then make sure that new project is selected in the top dropdown.
3. **Enable the Sheets API.** In the search bar at the top, type **"Google Sheets API"**, click it, then click **Enable**.
4. **Create the service account.** Search for **"Service Accounts"** (or go to **APIs & Services → Credentials → + Create Credentials → Service account**).
   - Name it (e.g. "scoreboard-bot") → **Create and Continue** → skip the optional steps → **Done**.
5. **Download the key file.** On the Credentials page, click your new service account → the **Keys** tab → **Add Key → Create new key → JSON → Create**. A `.json` file downloads to your computer.
6. **Keep the key OUT of the app folder and OUT of GitHub.** Move the downloaded `.json` file somewhere safe **outside** the project folder (e.g. a "Keys" folder). *Why:* this file is a password to your Sheet. If it ends up in GitHub, anyone could read and change your data. The project's `.gitignore` is set up to help prevent this, but the safest move is to never put it in the folder at all.
7. **Share the Sheet with the robot.** Open the `.json` file in a text editor and find the line that starts with `"client_email"`. It looks like `scoreboard-bot@acme-scoreboard.iam.gserviceaccount.com`. Copy that email. Then open your Google Sheet → **Share** → paste the email → set it to **Editor** → **Send**. (You can untick "Notify people".)

You now have three values from the `.json` file that you'll enter into Vercel in Step 4:
- `client_email` → **GOOGLE_SERVICE_ACCOUNT_EMAIL**
- `private_key` (the long block that starts with `-----BEGIN PRIVATE KEY-----`) → **GOOGLE_PRIVATE_KEY**
- the Sheet ID from Step 1 → **GOOGLE_SHEET_ID**

---

## 5. Step 3 — Push the code to GitHub

1. Open **GitHub Desktop** and sign in.
2. **File → Add local repository** and choose this project folder. If it says it isn't a repository, click **"create a repository"** and confirm.
3. Give the repository a **client-specific name** (e.g. `acme-scoreboard`).
4. Make sure the summary box (bottom-left) has a message like "first commit", then click **Commit to main**.
5. Click **Publish repository** (top). **Keep "Keep this code private" ticked.** Publish.
6. Verify: go to <https://github.com> → your repositories → you should see the new private repo with all the files.

> Double-check that there is **no `.json` key file** and **no `.env` file** listed in the repo. If you see one, stop and remove it before continuing.

---

## 6. Step 4 — Deploy on Vercel

1. Go to <https://vercel.com/new>.
2. **Import** your GitHub repository (`acme-scoreboard`). If prompted, give Vercel access to the repo.
3. Vercel auto-detects it as a **Vite** app — leave the build settings as they are.
4. Expand **Environment Variables** and add each of these by **exact name**. Copy the values carefully:

   | Name | Where the value comes from |
   |---|---|
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` from your `.json` key file |
   | `GOOGLE_PRIVATE_KEY` | The `private_key` from your `.json` key file — copy the whole thing, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines |
   | `GOOGLE_SHEET_ID` | The Sheet ID from the Sheet's URL (Step 1) |
   | `ADMIN_USERNAME` | The starter admin username you choose (e.g. `admin`) |
   | `ADMIN_PIN` | A 4-digit starter PIN you choose (the admin changes it on first login) |

   > **About the private key:** paste it exactly as it appears in the JSON file. If your JSON shows the key as one long line with `\n` in it, paste it exactly like that — the app converts the `\n` back into line breaks automatically. Do not add or remove quotes.

5. Click **Deploy**. Watch the log; after a minute you'll see **"Build Completed"** and a **Congratulations** screen.
6. Click **Visit** (or **Continue to Dashboard → Domains**) to get your **live URL**, e.g. `https://acme-scoreboard.vercel.app`. Share that URL with the client.

---

## 7. Step 5 — First login and setup

1. Open the live URL.
2. Log in with the **ADMIN_USERNAME** and **ADMIN_PIN** you set in Vercel.
3. You'll be asked to **create your admin PIN** — choose a new 4-digit PIN and confirm it. (The starter PIN is now retired.)
4. The **4-step setup wizard** opens. All fields start empty:
   - **Step 1 — The BAG:** client/team name, goal statement, start value, target value, unit, deadline, lag update cadence, and how the lead measures are counted (team total vs. individual).
   - **Step 2 — Lead Measures:** name, description, unit, target per period, **cadence (daily/weekly)**, and who enters the data — for one or two measures.
   - **Step 3 — Users:** add each person's name, username, role, and (optionally) team/shift. No PINs here — each person sets their own on first login.
   - **Step 4 — Scoreboard Style:** pick **Progress bars** or **Trend chart** from the two live previews. You can change this anytime later.
5. Click **Finish setup**. The scoreboard goes live.
6. **Test a team member:** open the URL in a private/incognito window, log in with one of the usernames you created, choose a PIN, and on the log screen tap **+** a few times and press **Submit**.
7. **Confirm it saved:** open your Google Sheet → `lead_entries` tab. You should see a new row with the timestamp, the user, the measure, and the value. Refresh the scoreboard — the number should appear.

That's it. The client is live.

---

## 8. Changing the brand colors

Every color in the app comes from **one place**. To rebrand for a client:

1. Open **`tailwind.config.js`**.
2. At the very top you'll see this block. Change the three hex values:
   ```javascript
   const BRAND = {
     primary:    '#13314f',  // headers, primary buttons, BAG chart target line
     accent:     '#8B2D3A',  // BAG actual line, log button, highlights
     background: '#FFFFFF',  // page background
   };
   ```
3. Save the file.
4. In **GitHub Desktop**: type a short message (e.g. "brand colors"), **Commit to main**, then **Push origin**.
5. Vercel redeploys automatically within a minute. Refresh the live site to see the new colors.

You never edit colors anywhere else — every component reads from this block.

To change the **logo**, replace `public/logo.png` with the client's logo (keep the same filename), then commit and push the same way.

---

## 9. Troubleshooting

**The page is blank / "Can't reach the scoreboard data."**
Your environment variables are probably missing or misspelled. In Vercel → your project → **Settings → Environment Variables**, confirm all five names exactly match the table in Step 4. After fixing, go to **Deployments → ⋯ → Redeploy**.

**"403" or "The caller does not have permission" from Google.**
You didn't share the Sheet with the service account, or shared it as Viewer. Open the Sheet → **Share** → add the `client_email` from the JSON key → set it to **Editor**.

**"Unable to parse key" / private key errors.**
The `GOOGLE_PRIVATE_KEY` value is incomplete. Re-copy the entire `private_key` value from the JSON file, including the `BEGIN`/`END` lines. Don't wrap it in extra quotes.

**Login says "Incorrect username or PIN" for the very first admin login.**
Check `ADMIN_USERNAME` and `ADMIN_PIN` in Vercel. The username is case-insensitive; the PIN must be exactly the 4 digits you set.

**A build failed on Vercel.**
Open the failed deployment's **Build Logs**. Most failures are a typo in an environment variable name or a missing one. Fix it in Settings and redeploy.

**No data shows on the scoreboard.**
Make sure setup was finished (Step 4 → Finish). Confirm the five tab names and row-1 headers exactly match Step 1 — a misspelled tab name is the usual cause. Check that entries are landing in `lead_entries`/`lag_entries`.

**The setup wizard keeps reappearing.**
Setup writes `setup_complete = true` into the `config` tab. If it can't write (permission or tab-name problem), it never flips. Fix the Sheet sharing/tab names (see the two items above), then run the wizard again.

---

## What's inside (for a developer)

- **Frontend:** React + Vite, styled with Tailwind. Charts via Recharts.
- **Data:** Google Sheets (five tabs), reached only through the serverless function at `api/sheets.js`.
- **Auth:** username + 4-digit PIN, hashed (SHA-256, salted with the username) and stored in the `users` tab. Roles: `admin`, `team_member`.
- **Config:** lives in the `config` tab; read and parsed by `src/utils/config.js`. The app ships with no client data.
- **The math:** `src/utils/progress.js` — prorated targets, status thresholds, period keys, and the BAG trend series. It branches on the stored cadence; nothing is hardcoded to daily or weekly.

### Local development (optional)
The app is built to run on Vercel. To run it locally you need Node.js and the Vercel CLI:
```bash
npm install
npm i -g vercel
vercel dev        # serves the frontend AND the /api function together
```
Create a local `.env` (copy `.env.example`) with the same values you put in Vercel.
