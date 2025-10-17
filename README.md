# Systems Credentials Browser (GitHub Pages Ready)

Static Web App to browse credentials consolidated from 5 Excel files.

## Deploy (GitHub Pages)
1. Create a new public repo.
2. Upload the entire folder contents (this README, index.html, styles.css, app.js, and the `assets` folder).
3. In repo settings → Pages → Source: `Deploy from a branch` → select `main` and `/ (root)`.
4. Wait for Pages to go live, then open the published URL.

## Usage
- Select **System → Category → Equipment**, then click **Show results**.
- Cards display **Category, Equipment, Login ID, Password, IP, Remark**.
- Empty fields are hidden; rows with no data are skipped.

## Notes
- Equipment names are auto-cleaned to **strip leading index tokens** like `b.3`, `1`, `4a.1` if followed by a space.
- Data file: `assets/data.json` (and `assets/data.csv` for reference).
