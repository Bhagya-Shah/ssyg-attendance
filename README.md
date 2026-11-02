# SSYG Attendance Tracker

A free attendance app. The website is hosted free on **Vercel**, your **Google Sheet is the database**, and a small **Google Apps Script** connects the two. Nothing to pay for and no server to manage.

## What it does

- **Members**: add one at a time or paste a whole list, edit, remove (kept in history, can be restored) or delete forever.
- **Events**: any date, with a name and an optional description.
- **Mark attendance**: open an event, tick who was present (search, Select all, Clear), Save.
- **Export**: choose a date range (or This month / Last 3 months / This year / All time), preview the report, and download a CSV that opens in Excel or Google Sheets. It shows P/A per event, each member's total and attendance %, and the total present per event.
- **Two kinds of access**
  - **Open (viewer)**: anyone with the link can see events, who attended, member names and export reports. No phone numbers or emails are shown.
  - **Admin**: click **Admin login** and enter the admin password to add/edit/delete members and events and mark attendance. A login lasts 6 hours.
- Works on phones and laptops.

## How it's built

```
Members' phones / laptops
        │  open ssyg-attendance.vercel.app
        ▼
web/  (static website on Vercel, free)
        │  fetch() JSON calls
        ▼
apps-script/Code.gs  (Google Apps Script web app = the API, free)
        │
        ▼
Google Sheet: Members | Events | Attendance tabs
```

| Path | Purpose |
|---|---|
| `apps-script/Code.gs` | Backend API: reads and writes the Google Sheet, checks the admin password |
| `web/index.html`, `web/app.js`, `web/styles.css` | The website |
| `web/config.js` | **The one file you edit**: your Apps Script API URL |
| `test/` | Local test harness with a fake sheet (not deployed) |

## Setup (about 15 minutes, one time)

### Part A: Google Sheet + API

1. **Create the sheet.** Go to <https://sheets.new> and name it, for example, `SSYG Attendance`.
2. **Open Apps Script.** In the sheet: **Extensions > Apps Script**.
3. **Paste the backend.** Delete everything in the editor's `Code.gs` and paste in the contents of [`apps-script/Code.gs`](apps-script/Code.gs). Save (Ctrl/Cmd + S).
4. **Set the admin password.** Gear icon (**Project Settings**) > **Script Properties** > **Add script property**:
   - Property: `ADMIN_PASSWORD`
   - Value: your password
   - **Save script properties**.
5. **Create the sheet tabs.** Back in the editor (`<>` icon), pick `setup` in the function dropdown and click **Run**. Allow the permissions:
   **Review permissions > your account > Advanced > Go to (project) (unsafe) > Allow**.
   ("Unsafe" only because it's your own unpublished script.) The sheet now has `Members`, `Events` and `Attendance` tabs.
6. **Deploy the API.** **Deploy > New deployment** > gear > **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**  (required so the website can reach it; only the admin password allows changes)
   - **Deploy**, then copy the **Web app URL** (ends in `/exec`).
   Opening that URL in a browser should show `{"ok":true,...,"message":"API is running"}`.

### Part B: Website on Vercel

7. **Put the API URL in the code.** On your laptop, in this repo, edit `web/config.js` and replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL from step 6. Commit and push:
   ```bash
   git add web/config.js && git commit -m "Set API URL" && git push
   ```
8. **Deploy on Vercel.** Sign up free at <https://vercel.com> with your GitHub account > **Add New… > Project** > import this repo, then:
   - Framework Preset: **Other**
   - Root Directory: **`web`**
   - No build command needed. Click **Deploy**.
   You get a link like `https://ssyg-attendance.vercel.app` (rename it under Project Settings > Domains if you want).
9. **Use it.** Open the link, click **Admin login**, enter your password, go to **Members > Add many** and paste your member list (one per line, optionally `Name, Phone`).
10. **Share** the link with everyone. They can view without a password; only people who know the admin password can make changes.

## Updating the app later

- **Website changes** (`web/`): commit and push to GitHub. Vercel redeploys automatically in under a minute.
- **Backend changes** (`apps-script/Code.gs`): paste the new code into the Apps Script editor, then **Deploy > Manage deployments > pencil (edit) > Version: New version > Deploy**. Editing the existing deployment keeps the same URL, so `config.js` doesn't change.
- **Change the admin password**: edit `ADMIN_PASSWORD` in Script Properties. No redeploy needed.

### Optional: push the backend from your laptop with clasp

```bash
npm install -g @google/clasp
clasp login     # first enable the API at https://script.google.com/home/usersettings
# Script ID: Apps Script editor > Project Settings > IDs
cd apps-script && clasp clone <SCRIPT_ID>   # once; creates .clasp.json and appsscript.json
clasp push      # uploads Code.gs
```

Then redeploy a new version as above.

## Good to know

- **Editing the sheet directly is fine** (e.g. fix a typo in a name). Don't change the `ID` column or the header row.
- **Removed members** disappear from attendance marking but stay in old reports. Use *Show removed members* in the Members tab to restore or delete them forever.
- **Free limits**: Google's and Vercel's free tiers are far above what ~50 members and a few events a week need.
- **Speed**: each save or load takes about 1–2 seconds because Google Apps Script is the backend. That's normal.
- **Backups**: *File > Version history* in the sheet restores any earlier state.

## Local testing

```bash
./test/build.sh        # creates test/preview.html using an in-memory fake sheet
open test/preview.html # admin password in the preview is: secret123
# automated run (needs Playwright): mkdir -p test/shots && node test/e2e.js
```
