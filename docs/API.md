# AssesTrack API contract

This is the contract between the front-end (`js/`) and the server (Netlify Functions + Netlify Database + Netlify Blobs).
`tests/mock-api.mjs` is a working reference implementation of everything below, and `tests/frontend.test.mjs` runs the real front-end against it.
When this file and the mock disagree, fix whichever is wrong and keep them identical.

## Conventions

- Base path `/api`. JSON in, JSON out. Same origin only.
- Session: a random opaque id in an `HttpOnly; Secure; SameSite=Lax` cookie. Store only its hash. Expires after 12 hours. Logout deletes it.
- Every request that is not a GET must send `X-Requested-With: AssesTrack`; reject it with 403 otherwise.
- Errors: an HTTP status and `{"error":"message"}`. Messages are shown to people exactly as written, so reuse the wording in the mock.
  400 invalid input, 401 not signed in, 403 not allowed, 404 not found, 409 a rule or conflict, 429 too many attempts.
- Dates `YYYY-MM-DD`, times `HH:MM`, timestamps ISO 8601.
- **Time zone: Asia/Manila (UTC+8) for everything.** "Today" and "next week" are computed there, never in server time.
  Next week = the Monday of the current week plus 7 days, Monday to Friday. On Saturday and Sunday the "current week" is the one that just ended.
- A section key is `"<grade>|<section>"`, for example `"8|Jasmin"`. Grades and sections are listed in `SECTIONS` in `js/config.js`.

## Shapes

```
User     {id, name, email|null, username|null, role:"scholar"|"teacher"|"admin", grade|null, section|null, createdAt, lastLoginAt|null}
Item     {id, sec:"8|Jasmin", date, time, subject, type:"fa"|"long"|"aa", description, teacher:<display name>, createdAt,
          files:[{id,name,type,size}], reactions:{"👍":[display names]}, comments:[{id,author,role,text,at}], moves:[{from,to,by,at}]}
Event    {id, date, title, kind:"holiday"|"event"}
Request  {id, by:<display name>, at, grade, f:{subject,type,date,time,description,secs:["Jasmin"]}, status:"pending"|"approved"|"denied", by2:<decider name>}
LogEntry {at, who, role, act, txt, id:<item id or undefined>}
Bootstrap{today, user:User, items:[Item], events:[Event], reqs:[Request], log:[LogEntry], prefs:{[user display name]:{[item id]:{st:"todo"|"studying"|"done", bell:boolean}}}, version:string}
```

## Accounts

| Endpoint | Who | Body | Success | Errors |
|---|---|---|---|---|
| `POST /signup` | anyone | `{fullName,email,password}` | `{user}` and signs the person in | 400 name needs 2+ words; 400 email must match `^[^\s@]+@zrc\.pshs\.edu\.ph$` (case-insensitive) with message `Use your ZRC email. It must end with @zrc.pshs.edu.ph`; 400 password under 8 characters; **409 `This email is already signed up. Please sign in instead.`** (compare lower-cased); 429 |
| `POST /login` | anyone | `{identifier,password}` (identifier = ZRC email, or the admin's username) | `{user}` and signs in | 401 `Wrong email/username or password.` (same message for unknown account and wrong password); 429 |
| `POST /logout` | signed in | none | `{ok:true}` and clears the cookie | |
| `GET /me` | signed in | | `{user}` | 401 |
| `POST /profile` | scholar | `{grade,section}` | `{user}` | 403 if a section is already set (`Ask an admin to change your section.`); 400 invalid section |
| `POST /change-password` | signed in | `{currentPassword,newPassword}` | `{ok:true}` | 400 current password wrong; 400 new password under 8 characters |

New accounts are always `scholar` with no grade or section. There is exactly **one** admin account (see Environment variables). No endpoint can create or promote an admin.

## Shared data

| Endpoint | Who | Notes |
|---|---|---|
| `GET /version` | signed in | `{version}`. A string that changes whenever any shared data changes (keep a counter that every write increments). The front-end polls this every 45 seconds and reloads when it changes. |
| `GET /bootstrap` | signed in | The `Bootstrap` shape, filtered for the caller (see Visibility). |
| `POST /assessments` | teacher, admin | `{subject,type,date,time,description,grade,secs:[...],files:[{name,type,data}],override?}`. Creates one item per section. `files[].data` is a data URL. `override:true` is admin only and skips only the daily limit. Returns `{items}`. 409 with `{error,blocked:[section names]}` when the daily limit stops it. |
| `POST /assessments/:id/move` | teacher, admin | `{date}`. Same rules as creating. 403 `You cannot change this assessment.` when the item is not editable (rule R6). |
| `DELETE /assessments/:id` | teacher, admin | Same editable rule. |
| `POST /assessments/:id/react` | signed in | `{emoji}` toggles the caller's reaction. Only 👍 ✅ 👀 😰. |
| `POST /assessments/:id/comments` | signed in | `{text}`, 1 to 300 characters. |
| `PUT /assessments/:id/progress` | signed in | `{st,bell}`. Private to the caller. |
| `GET /files/:id` | signed in | The file, only if the caller may see its assessment. Store file contents in Netlify Blobs, metadata in the database. |
| `POST /events` / `DELETE /events/:id` | admin | `{date,title,kind}` (title up to 60 characters). |
| `POST /requests` | teacher | `{grade,f}` asks for an exception to the daily limit. |
| `POST /requests/:id/decide` | admin | `{approve:boolean}`. Approving creates the items as the requesting teacher, skipping only the daily limit. |

## Admin only

| Endpoint | Notes |
|---|---|
| `GET /admin/users` | `{users:[User]}`. Never any password data. |
| `PATCH /admin/users/:id` | `{role?}` (only `scholar` or `teacher`), `{grade,section}` (both, or both `null`). The admin account itself cannot be changed. |
| `POST /admin/users/:id/reset-password` | Sets a random temporary password, ends that person's sessions, returns `{temporaryPassword}` once. |
| `DELETE /admin/users/:id` | Deletes the account. Not allowed for the admin account. |
| `GET /admin/tables/:name?offset=&limit=` | Read-only viewer. `{name,columns,rows,total,offset,limit}`. Allowed names: `users`, `assessments`, `attachments`, `comments`, `reactions`, `progress`, `events`, `exception_requests`, `audit_log`. `users` must never include password hashes. Sessions and rate-limit tables are never exposed. |

**Nobody can read a password.** Hash with argon2id (or bcrypt, cost 12 or more). The admin sees names, emails, roles, sections and dates, and can reset a password, but cannot read one.

## Business rules (enforce on the server AND in the database)

- **R1** At most 3 assessments per section per date. Use a database trigger that takes an advisory lock, so two simultaneous requests cannot both succeed.
- **R2** One entry per subject per section per date (case-insensitive unique index).
- **R3** `fa` and `long`: only Monday to Friday of next week. `aa`: any date after today.
- **R4** No assessments on a date that has an event of kind `holiday`.
- **R5** Roles: scholar reads their own section and may comment, react and set progress. Teacher schedules, moves and removes for any section (one request may target several sections of one grade). Admin can do everything, and manages events, requests and accounts.
- **R6** Move and remove are allowed when the item is in the future and (the caller is admin, or the type is `aa`, or the date is in next week). A move re-checks R1 to R4 for the new date and records `{from,to,by,at}`.
- **R7** A blocked teacher can file a request; the admin approves (skipping only R1) or denies. The admin can also add directly with `override:true`.
- **R8** Every create, move, remove, request, decision, calendar change and account reset writes an `audit_log` row on the server. The browser never writes the log.
- **R9** Files: up to 3 per assessment, 700 KB each.

## Visibility

- Scholars receive full `Item`s only for their own section. For every other section they receive blank rows of the same shape (`id:""`, `time:"00:00"`, empty text, empty lists) that keep only `sec`, `date` and `type`, because the heatmap needs them.
- Teachers and admins receive everything. `log`: teachers and admins (scholars get `[]`). `reqs`: admin all, teacher their own, scholars `[]`.
- `prefs` contains only the caller's own progress, keyed by their display name.

## Suggested database

`users`, `sessions` (hash only), `login_attempts`, `assessments`, `assessment_moves`, `attachments`, `reactions` (unique assessment + user + emoji), `comments`, `progress` (unique user + assessment), `events`, `exception_requests`, `audit_log`, and one row holding the data version counter.
Use foreign keys, check constraints, an index on `(grade, section, date)`, and parameterized SQL only.

## Environment variables (set in Netlify's site settings, never in the repo)

- `ADMIN_USERNAME` and `ADMIN_INITIAL_PASSWORD`: used once, on first run, to create the single admin account if none exists. The admin signs in with the username; everyone else signs in with their ZRC email.
