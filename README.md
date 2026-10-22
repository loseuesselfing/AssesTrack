# AssesTrack

The weekly assessment scheduler for PSHS-ZRC. Teachers schedule FA, long quizzes and AA for each section;
scholars see what is due for their own section; an admin oversees everything.
School policy is enforced automatically: **no section may have more than 3 assessments on one day.**

Everyone shares one database, so what one person adds or changes appears for everyone else
(the page checks for changes every 45 seconds and whenever you return to the tab).

## How it is built

- **Front-end:** this repo's `index.html`, `css/` and `js/` (plain ES modules, Tailwind from a CDN, no build step).
- **Server:** Netlify Functions in `netlify/functions` and a Netlify Database (Postgres) with migrations in `netlify/database`, built to the contract in [`docs/API.md`](docs/API.md).
- **Files:** attachments live in Netlify Blobs.
- The only thing kept in your browser is your theme choice.

## Accounts

- **Sign up** needs your full name, your ZRC email (`@zrc.pshs.edu.ph` only) and a password of at least 8 characters.
  An email that is already registered is refused with a clear message.
- New accounts are **Scholars**. After signing up you choose your grade level and section once; only an admin can change it later.
- The **admin** switches teachers to the Teacher role in the Admin panel. There is exactly one admin account; its username and
  password come from the Netlify environment variables `ADMIN_USERNAME` and `ADMIN_INITIAL_PASSWORD` (never put them in this repo).
  The admin signs in with the username; everyone else uses their email.
- **Passwords are hashed.** Nobody, including the admin, can read them. The admin can reset one, which shows a temporary password once.

## Rules

- Max 3 assessments per section per day. A subject counts once per day.
- FA and Long quiz: next week only. AA: any later date.
- No assessments on holidays (the admin manages holidays and events).
- The heatmap shades by workload: FA counts 1; Long quiz and AA count 2.
- If a day is full, teachers can request an exception; the admin approves, denies or overrides.

## Settings (gear icon, top right)

A menu with **Profile** (your details and change password), **Appearance** (five themes) and **Data Privacy Act**.
The Dark / Light button in the header jumps straight to Dark and back.

## Admin panel

Users (roles, sections, reset password, delete), Database (read-only view of every table), Calendar (holidays and events),
Requests (exception requests) and History (who changed what, and when).

## Run, test, deploy

- Deploy: connect this repo to a Netlify site, then set `ADMIN_USERNAME` and `ADMIN_INITIAL_PASSWORD` under Site configuration, Environment variables.
- Local server: `netlify dev` (needs the Netlify CLI).
- Tests: `npm test` runs the real front-end against a reference server (`tests/mock-api.mjs`) that mirrors `docs/API.md`.

## Folder map

```
index.html            page shell
css/styles.css        the five themes (CSS variables), heatmap colours
js/
  main.js             entry point; exposes actions to inline handlers; refreshes shared data
  api.js              talks to the server
  config.js           constants: limit, types, sections, subjects, sign-up rules
  utils.js            dates (Asia/Manila), formatting, escaping, toast
  state.js            the shared state object S and small queries
  rules.js            workload weight and best-day suggestions
  actions.js          everything a user can do
  render.js           chooses loading, sign-in, first-time setup or the dashboard
  views/              one file per screen
docs/API.md           the contract the server must follow
tests/                reference server and front-end tests
```

## Where to change things

| To change... | Edit |
|--------------|------|
| The daily limit, sections, subject lists | `js/config.js` (and the matching rule on the server) |
| Assessment types, heatmap weights, which can be scheduled ahead | `js/config.js` (`TYPES`) |
| A screen's layout | the matching file in `js/views/` |
| Colours and themes | `css/styles.css` and `THEMES` in `js/config.js` |
| Grades 11 and 12 subjects | `js/config.js`, `SUBJECTS` (currently empty) |
