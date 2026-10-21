# AssesTrack

Weekly assessment scheduler for PSHS-ZRC. Teachers schedule FA, long quizzes and AA;
scholars see what is due for their own section. School policy is enforced automatically:
**no section may have more than 3 assessments on one day.**

This is a front-end demo. Data is saved in each browser's `localStorage`; there is no server yet.

## Run it

The JavaScript uses ES modules, so opening `index.html` by double-click will not work.

1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

No Live Server? From this folder run `python -m http.server 8000` and open http://localhost:8000.

To publish free: push to GitHub, then Settings, Pages, deploy from the `main` branch root.

## Demo accounts

| Role | Username | Password |
|------|----------|----------|
| Teacher | `teacher` | `teacher123` |
| Admin | `admin` | `admin123` |
| Scholar / Staff | any name, pick grade and section | `scholar123` |

## Themes

Click the **gear icon** (top right, also on the sign-in page) to open Settings. It holds the theme choice, your account and the Data Privacy Notice. The ☾ Dark / ☀ Light button in the header (and on the sign-in page) jumps straight to Dark and back to your previous theme. Your choice is remembered.

| Theme | Look |
|-------|------|
| Light | Clean blue and white (default) |
| Dark | Navy dark mode; first visit follows your device setting |
| Forest | Warm cream paper, deep green, serif headings |
| Blueprint | Dark engineering-paper blue with grid lines, cyan accent, monospace headings, square corners |
| Sunset | Warm cream with a plum-to-orange header, rounder shapes |

To add a theme: copy a `[data-theme=...]` block in `css/styles.css`, change the variables, then add `{id, label, swatch}` to `THEMES` in `js/config.js`. Keep text contrast at 4.5:1 or better.

## Rules

- Max 3 assessments per day for each section. A subject counts once per day.
- FA and Long quiz: next week only. AA: any later date (so projects and longer tasks can be planned ahead).
- No assessments on holidays (the admin manages holidays and events).
- The heatmap shades each section and day by workload, not just count: FA is light (counts 1); Long quiz and AA are heavy (count 2). Levels are Free, Light, Moderate, Busy and Heavy, and each cell lists what is scheduled. The weights are in `TYPES` in `js/config.js`.
- Best-day suggestions prefer the lightest days.
- If a day is full, teachers can request an exception; the admin approves, denies or overrides.

## Folder map

```
index.html            page shell, loads Tailwind (CDN) and js/main.js
css/styles.css        the five themes (as CSS variables), heatmap colours
js/
  main.js             entry point, exposes actions to inline handlers
  config.js           constants: limit, types, sections, subjects, accounts
  utils.js            dates, formatting, escaping, toast
  storage.js          demo seed data, loading from localStorage
  state.js            shared state object S, saving, queries
  rules.js            best-day suggestions, creating assessments
  actions.js          everything a user can do (log in, add, move, comment...)
  render.js           chooses login or dashboard
  views/              one file per screen or piece of UI
    shared.js  login.js  privacy.js  dashboard.js  home.js  week.js
    month.js   heat.js   admin.js    modal.js      panel.js    settings.js
```

## Where to change things

| To change... | Edit |
|--------------|------|
| The daily limit, sections, subject lists, demo accounts | `js/config.js` |
| Scheduling or lock rules | `js/actions.js` (`submitItem`, `moveItem`), `js/rules.js` |
| A screen's layout | the matching file in `js/views/` |
| Assessment types (FA, Long quiz, AA), their heatmap weight, and which can be scheduled ahead | `js/config.js` (`TYPES`) |
| Colours and the five themes | `css/styles.css` (variables per theme), `THEMES` in `js/config.js` |
| Demo data | `js/storage.js` |
| Grades 11 and 12 subjects | `js/config.js`, `SUBJECTS` (currently empty) |

## How the code fits together

- `state.js` holds one object, `S`. Views read it and return HTML strings; `render()` redraws the page.
- `actions.js` changes `S`, saves, then calls `render()`.
- Views use inline `onclick="..."` handlers. `main.js` copies every export of `actions.js` onto `window` so they work.
- Views never import `actions.js` or `render.js`, which keeps the import graph free of cycles.

## Known limits

- Saved data from older versions is converted automatically (Quiz to FA, Task and Project to AA).
- No shared backend: teachers on different computers do not see each other's changes.
- Attached files are stored in the browser (max 3 per entry, 700 KB each).
- Reminders only show while the page is open.
- The Data Privacy Notice (RA 10173) is a template; the school's Data Protection Officer should review it.
