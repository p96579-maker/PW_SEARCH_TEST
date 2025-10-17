# Systems Credentials Search

A lightweight static web app to browse/search credentials from 5 Excel files.

## Features
- Step-by-step filters: **System → Category → Equipment**
- Card layout: shows **Category, Equipment, Login ID, Password, IP, Remark**
- Empty fields hidden; rows with no data are skipped
- Merged cells handled via forward-fill when ingesting

## Files
- `data.json` / `data.csv` / `data.xlsx` – consolidated data
- `index.html` + `styles.css` + `app.js` – static app (no build required)

## How to use
1. Open `index.html` locally, or host the folder on GitHub Pages / Netlify.
2. To refresh data, replace the 5 Excel files and re-run the Python builder.

## Notes
- Sheet headers are auto-mapped using heuristics (Chinese/English).
- If you see wrong column mapping, tell ChatGPT which exact headers map to:
  Category, Equipment, Login ID, Password, IP, Remark.
