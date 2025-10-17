
# APM Systems Password Search (Offline Web App)

This package is a **purely offline** mini web app that lets you select **System → Category → Equipment**
and view results in card format showing: **Category, Equipment, Login ID, Password, IP, Remark**.

## Files
- `index.html` — main UI (no external libraries; mobile-friendly)
- `app.js` — logic for filters and rendering
- `data/data.json` — your merged records from the 5 Excel files (edit or regenerate as needed)
- `systems_merged.xlsx` — merged Excel (exported separately at repo root alongside the zip)

## How to use
1. Unzip and open **index.html** in any browser. Everything works offline.
2. Use the dropdowns to filter by **System**, then **Category**, then **Equipment**.
3. Cards will show only non-empty fields; counts update live. Click **Reset** to clear filters.

## Updating data
If you edit the original spreadsheets, just re-run the build script or replace `data/data.json` with updated content.
Ensure the JSON objects contain these keys: `System`, `Category`, `Equipment`, `Login ID`, `Password`, `IP`, `Remark`.

## Notes
- The app is responsive and tested for small screens.
- No CDNs or frameworks, fully offline.
