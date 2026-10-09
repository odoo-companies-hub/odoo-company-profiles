# Odoo Company Profiles

A static, searchable directory of official Odoo implementation companies —
company name, contact email, phone number, address, and certification tier
(Gold / Silver / Ready) — with a short profile for each and a popup "Apply"
button that opens the company's own careers page.

Built from the same underlying dataset as the
[Odoo Partners Directory](https://odoo-companies-hub.github.io/odoo_companies/),
pulled from each company's own public listing on Odoo's official partner
directory (odoo.com/partners). No contact details are invented — if a
company hasn't published a phone number or email on its own profile, this
site shows "Not published".

## Careers links

For 212+ companies, `data.js` also carries a `careersUrl` — a verified link
to that company's actual careers/jobs page (found by scanning each
company's own website for a careers/jobs link, or manually confirmed).
Where no verified careers link exists, the "Apply" button falls back to the
company's homepage instead of guessing a URL that might not exist.

## Files
- `index.html` — directory page: search/filter, company cards, profile modal
- `about.html`, `contact.html` — site pages
- `styles.css` — shared styling
- `script.js` — search/filter/popup logic (client-side only, no backend)
- `data.js` — the company dataset

## Run locally
```
cd odoo-company-profiles
python3 -m http.server 8000
```
Then visit http://localhost:8000

## Deploy on GitHub Pages
1. Push this repo to GitHub.
2. Settings → Pages → Source: `main` branch, `/ (root)` folder → Save.
3. Live at `https://<username>.github.io/<repo-name>/` within a minute or two.

## Legal note
This is an independent, unofficial resource. It is not affiliated with or
endorsed by Odoo S.A. "Odoo" is a trademark of Odoo S.A.
