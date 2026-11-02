# SSYG Attendance Tracker

A free attendance app. Your **Google Sheet is the database** and **Google Apps Script** hosts the web app, so there is nothing to pay for and no server to run.

## What it does

- **Members**: add one at a time or paste a whole list, edit, remove (kept in history, can be restored) or delete forever.
- **Events**: any date, with a name and an optional description.
- **Mark attendance**: open an event, tick who was present (search, Select all, Clear), Save.
- **Export**: choose a date range (or This month / Last 3 months / This year / All time), preview the report, and download a CSV that opens in Excel or Google Sheets. It shows P/A per event, each member's total and attendance %, and the total present per event.
- **Two kinds of access**
  - **Open (viewer)**: anyone with the link can see events, who attended, member names and export reports. No phone numbers or emails are shown.
  - **Admin**: click **Admin login** and enter the admin password to add/edit/delete members and events and mark attendance. A login lasts 6 hours.
- Works on phones and laptops.

## Files

| File | Purpose |
|---|---|
| `Code.gs` | Backend: reads and writes the Google Sheet, checks the admin password |
| `Index.html` | The whole user interface |
| `test/` | Local test harness (mock Google Sheet) - not needed for deployment |

## Setup (about 10 minutes, one time)

1. **Create the sheet.** Go to <https://sheets.new> and name it, for example, `SSYG Attendance`.
2. **Open Apps Script.** In the sheet: **Extensions > Apps Script**.
3. **Paste the backend.** Delete everything in `Code.gs` in the editor and paste in the contents of this repo's [`Code.gs`](Code.gs).
4. **Add the UI file.** Click **+** next to *Files* > **HTML**, name it exactly `Index` (the editor adds `.html`). Replace its contents with this repo's [`Index.html`](Index.html).
5. **Save** (Ctrl/Cmd + S).
6. **Set the admin password.** Click the gear icon (**Project Settings**) > scroll to **Script Properties** > **Add script property**:
   - Property: `ADMIN_PASSWORD`
   - Value: your password
   - Click **Save script properties**.
7. **Create the sheet tabs.** Back in the editor (`<>` icon), pick `setup` in the function dropdown at the top and click **Run**. Google will ask for permission:
   **Review permissions > choose your account > Advanced > Go to (project name) (unsafe) > Allow**.
   (It says "unsafe" only because it's your own unpublished script.) The sheet now has `Members`, `Events` and `Attendance` tabs.
8. **Deploy the web app.** **Deploy > New deployment** > gear icon > **Web app**:
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL**.
9. **Use it.** Open the URL, click **Admin login**, enter your password, go to **Members > Add many** and paste your member list (one per line, optionally `Name, Phone`).
10. **Share** the same URL with everyone. They can view without a password; only people who know the admin password can make changes.

## Updating the app later

After changing `Code.gs` or `Index.html` in the Apps Script editor: **Deploy > Manage deployments > pencil (edit) > Version: New version > Deploy**. The URL stays the same.

To change the admin password, edit `ADMIN_PASSWORD` in Script Properties. No redeploy needed.

### Optional: push code from your laptop with clasp

Instead of copy-pasting, you can use Google's `clasp` CLI:

```bash
npm install -g @google/clasp
clasp login
# Script ID: Apps Script editor > Project Settings > IDs
clasp clone <SCRIPT_ID> --rootDir ./gas   # once, to get .clasp.json
cp Code.gs Index.html gas/ && cd gas && clasp push
```

Then redeploy a new version as above. (In Apps Script settings, enable "Google Apps Script API" at <https://script.google.com/home/usersettings> first.)

## Good to know

- **Editing the sheet directly is fine** (e.g. fix a typo in a name). Don't change the `ID` column or the header row.
- **Removed members** disappear from attendance marking but stay in old reports. Use *Show removed members* in the Members tab to restore or delete them forever.
- **Free limits**: Google's free quotas are far above what ~50 members and a few events a week need.
- **Backups**: *File > Version history* in the sheet restores any earlier state.

## Local testing

```bash
./test/build.sh        # creates test/preview.html using an in-memory fake sheet
open test/preview.html # admin password in the preview is: secret123
```
