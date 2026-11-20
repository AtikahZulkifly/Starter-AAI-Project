# Login – Design

> **This file answers:** How is the app put together? (data, rules, screens,
> where the code lives)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file.

**Scope:** the login module of `01-requirements.md` (U1–U10). The `LeaveRequest`
table and the leave screens join this file when the leave module is specced — they
are added below the existing entries, never over them.

## 1. Tables

### `User` – one row per person who can log in

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `name` | text | yes | Full name, e.g. "Employee 1" |
| `icNumber` | text | yes | Identity card number, format `xx-xxxxxx` (two digits, hyphen, six digits), unique |
| `email` | text | yes | Work email, unique, always ends `@budiman.com`; the login username |
| `password` | text | yes | bcrypt hash (`$2b$…`, cost 10; bcryptjs 3.x writes `$2b$`) — never plain text, never shown or logged |
| `role` | text | yes | One of: `Employee`, `Supervisor`, `HR`, `Admin` (Reference A) — exactly one per user |
| `division` | text | yes | One of the five divisions (Reference A); used later to pick a supervisor |
| `designation` | text | yes | Job title (Reference A) |
| `createdAt` | date | auto | Set by the database when the row is created |

Uniqueness is enforced by the database (`email` and `icNumber` unique), not only by
the form. The six demo rows come from Reference B and are loaded by the seed script
with the password hashed at seed time.

## 2. Business rules

1. **Login required.** Every page and every server action except `/login` checks the
   signed session cookie on the server. No session → redirect to `/login` (AC-08).
2. **Email identity.** The entered email is trimmed and lowercased before it is
   compared; it must end with `@budiman.com` — checked in the form *and* again in the
   server action (AC-02, AC-05). Emails are unique in the database.
3. **Passwords are hashed.** bcryptjs, cost 10, at seed time and at HR reset time.
   The plain password exists only inside the request that logs in; it is never stored,
   displayed or logged (AC-14).
4. **Sessions are signed cookies.** The cookie holds user id, role and expiry, signed
   with `SESSION_SECRET` from `.env` — never a password or the full user row. Attributes:
   `httpOnly`, `sameSite=lax`, `secure` when served over HTTPS. Expiry: 8 hours, or
   30 days when "Remember me" was ticked (AC-12). There is no server-side session store.
5. **Failures leak nothing.** Every credential failure answers with the single message
   "Incorrect email or password", whether the email is unknown or the password wrong
   (AC-03, AC-04). Failed attempts are counted per IP in memory; the 6th attempt within
   15 minutes is refused with "Too many attempts — try again in 15 minutes", and a dev
   restart clears the counters (AC-06).
6. **The role decides the pages.** Each page and each server action re-checks the
   session *and* the role on the server — the top bar is decoration, never the check.
   Logged in but the wrong role → the 403 screen (AC-09). A signed-in user who opens
   `/login` is redirected to their own home (AC-10).
7. **Rule 7 on paper actions.** Sign-in asks "Sign in as {email}?" in the browser
   before the request leaves; if cancelled, nothing is sent and no attempt is counted
   (AC-07). Log out and password reset each have their own confirmation, and every
   successful action ends with a success message (AC-11, AC-13).
8. **Only HR resets passwords.** An HR officer can reset any user's password to
   `password123` from `/hr/password-reset`; the action is HR-only server-side, and the
   target user is chosen from a list, never typed as free text (AC-13). *(Spec
   amendment approved 20/11/2026 — see requirements §3.)*
9. **Accounts are seeded, not signed up.** There is no sign-up form and no way to
   create a user through the app (requirements §5).

## 3. Technology

| Part | Choice | In plain words |
|------|--------|----------------|
| Web framework | Next.js (App Router) + TypeScript | Pages and server logic in one project |
| Database | SQLite with Prisma | One file, no database server; Prisma checks the `User` shape |
| Styling | Tailwind CSS | Styles sit next to each screen |
| Login | Signed session cookie + bcryptjs | The cookie proves who you are without a server session; bcrypt turns `password123` into a hash before it is stored |
| Forms and actions | Server actions | The login, logout and reset forms post straight to server code — no separate API |
| Secret | `SESSION_SECRET` in `.env` | The key that signs cookies; lives only on the laptop, never committed |

## 4. Screens (routes)

The look of every screen follows §8 (visual design); the "What it shows" column
below stays the behavioural contract and is unchanged by the restyling.

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/` | anyone | Redirects: signed in → own home page, not signed in → `/login` | Done |
| `/login` | anyone not signed in | Split auth card per §8: pink illustration panel left; right panel with centred "Sign in" heading, email field, password field (masked), "Remember me" tick, full-width **Sign in** button, and the static helper line "Forgot your password? Ask HR to reset it."; errors appear above the button. The sign-in confirmation ("Sign in as {email}?") and the "Too many attempts" refusal come from rules 5 and 7. A signed-in visitor is bounced to their home (AC-10) | Done |
| `/employee` | Employee | The employee home page per §8: salmon top bar, warm-grey page, white rounded card with a "Welcome back, {name}" message (content arrives with the leave module); top bar shows name, role and **Log out** (AC-15) | Done |
| `/supervisor` | Supervisor | The supervisor home page, same pattern | Done |
| `/hr` | HR | The HR home page, same pattern, plus a salmon link to the password-reset page | Done |
| `/admin` | Admin | The admin home page, same pattern (the record view itself is a later module) | Done |
| `/hr/password-reset` | HR only | List of all users (name, email, role) in a §8 card; each row has a salmon **Reset password** button, which confirms "Reset {name}'s password to password123?" and then shows a success message (AC-13) | Done |
| — (403 screen) | nobody directly | Not a URL: the shared "403 — you don't have access to this page" card a page renders when the role check fails (AC-09). No data from the refused area is shown | Done |

## 5. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The `User` model from §1 |
| `prisma/seed.ts` | Creates the six Reference B people with `password123` hashed by bcryptjs |
| `.env` | `SESSION_SECRET` (and the Prisma datasource URL). `.env.example` carries a placeholder and is committed; `.env` itself never is |
| `src/lib/session.ts` | Sign and read the session cookie (create session, read session, clear session) — the only place that touches the cookie |
| `src/lib/auth.ts` | `requireUser(roles)` — the shared server-side check behind rule 1 and rule 6: no session → redirect `/login`, wrong role → 403 screen |
| `src/lib/throttle.ts` | In-memory per-IP failed-attempt counters (rule 5) |
| `src/lib/users.ts` | Server-side lookups used by login and by the HR reset page |
| `src/app/layout.tsx` | App shell: renders the top bar for signed-in users |
| `src/app/page.tsx` | The `/` redirect of §4 |
| `src/app/login/page.tsx` | The login form, including the client-side sign-in confirmation and the error/success messages |
| `src/app/login/actions.ts` | Server actions: sign in (validate email format, check throttle, verify bcrypt hash, set cookie) and log out (clear cookie) |
| `src/app/employee/page.tsx` | Employee home — first line is `requireUser(["Employee"])` |
| `src/app/supervisor/page.tsx` | Supervisor home — `requireUser(["Supervisor"])` |
| `src/app/hr/page.tsx` | HR home — `requireUser(["HR"])` |
| `src/app/hr/password-reset/page.tsx` | The reset list — `requireUser(["HR"])` |
| `src/app/hr/password-reset/actions.ts` | The reset server action — re-checks `requireUser(["HR"])` before touching any row (rule 8) |
| `src/app/admin/page.tsx` | Admin home — `requireUser(["Admin"])` |
| `src/components/TopBar.tsx` | Name, role, **Log out** button with its confirmation (AC-11, AC-15); salmon bar per §8 |
| `src/components/Forbidden.tsx` | The shared 403 screen |
| `src/components/FlashMessage.tsx` | Success/error banner used by the messages above |
| `src/components/PageCard.tsx` | The shared white rounded card the home pages, the 403 screen and the reset list sit inside (§8) |
| `public/auth-illustration.webp` | Copy of the agreed picture; shown cropped (left half only) inside the login page's pink panel (§8) |

## 6. Security (in plain words)

- **Access control (OWASP A01).** `requireUser` runs on *every* page and *every*
  server action; the role list is hard-coded server-side, so a crafted cookie value
  or form tampering opens nothing. 403 and login pages show no data from the refused
  area.
- **Cryptography (A02).** Passwords only ever exist as bcrypt hashes (cost 10). The
  session cookie is signed with `SESSION_SECRET`, is `httpOnly` (no script can read
  it) and `sameSite=lax`. The secret lives in `.env`, which is gitignored.
- **Injection (A03).** All database access goes through Prisma's parameterised
  queries; user-typed text never becomes SQL. Email and role values are validated
  against fixed patterns (rule 2, Reference A) before use.
- **Configuration (A05).** Debug output and error pages show the generic messages,
  never stack traces or the stored hash. Demo data is the made-up people of
  Reference B only.
- **Identification failures (A07).** Generic failure message, per-IP throttle, and
  every session expiring by itself (8 hours / 30 days) cover password guessing and
  forgotten laptops.
- **Logging (A09).** The seed is the only place a plain password appears, and it is
  hashed before it reaches the database; sign-ins are not logged at all (requirements
  §5 puts the audit log out of scope), so no secret can leak through logs.

## 7. Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install the pinned dependencies |
| `npx prisma init` | Create the Prisma setup (datasource SQLite) — first time only |
| `npx prisma migrate dev --name init` | Apply the schema to `dev.db` |
| `npx prisma db seed` | Load the six demo people from Reference B |
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run lint` | Check the code |
| `npx prisma studio` | Open the database to eyeball hashes and rows (used by AC-13, AC-14) |

## 8. Visual design (picture reference, approved 20/11/2026)

Source: the mock-up picture supplied by Atikah on 20/11/2026 (left pink panel with
a 3D illustration, right white panel with centred heading, outlined inputs and a
full-width pill CTA). It is the look for `/login` and all app screens. **Only the
appearance changes — rules 1–9, the actions, confirmations and messages of §2/§4
stay exactly as built.** Agreed adaptations: no Google/Facebook buttons and no
"Or" divider (no social sign-in exists), no "Eng / LO" language control (the app
is English only); the picture's tagline and footer link become the static texts
below (dead links were rejected).

**Palette** (fixed hexes):

| Token | Hex | Where |
|-------|-----|-------|
| Page background | `#ECE9E7` | warm grey behind cards, every screen |
| Card | `#FFFFFF` | auth card, home cards, reset list, 403 card |
| Panel pink (gradient) | `#F8C7BF → #F09A90` | login left panel, top to bottom |
| Accent salmon | `#F5A199` (hover `#EE8D84`) | primary buttons, top bar, links |
| Ink | `#3B3837` | headings and body text |
| Muted grey | `#A29C9A` | field labels, helper text, placeholders |
| Hairline | `#E4DFDC` | input borders, card borders, table row separators |
| Error / success text | `#C0392B` / `#1E8449` | flash messages (unchanged meaning) |

**Shapes and spacing** (Tailwind in brackets): card radius 24 px (`rounded-3xl`),
buttons pill (`rounded-full`), inputs 8 px (`rounded-lg`), input height ≈ 42 px
(`px-3.5 py-2.5`), card padding 40 px (`p-10`), vertical rhythm on an 8 px grid —
field gaps 16 px (`space-y-4`), section gaps 32 px (`mt-8`). Cards get a soft
shadow (`shadow-[0_18px_45px_-20px_rgba(59,56,55,0.25)]`). Focus: 2 px salmon
ring on inputs and buttons.

**Per screen:**

- `/login` — full-height `#ECE9E7` page; one centred card, max-width 880 px, two
  columns (left ≈ 45%): the left column carries the panel-pink gradient with
  `public/auth-illustration.webp` shown cropped to its illustration side — a
  pixel-proved CSS background crop (the 400×277 file's shapes sit at x ≈5–29%,
  y ≈40–77%, so `background-size: 420% auto; background-position: 6.6% 55.1%`
  hides the picture's grey matting, its own tagline and its white form panel)
  and the
  static white tagline block top-left: **"Budiman HRMS" / "Leave Request
  module"**; the right column is white with the centred "Sign in" heading
  (text-2xl bold, ink), grey label above each field, the form's existing fields
  and button restyled, flash messages above the button, and the static grey
  helper line "Forgot your password? Ask HR to reset it." under it. Under 768 px
  the left panel collapses to a slim banner above the form.
- **App shell** — top bar is the accent salmon with white text: brand
  "Budiman HRMS" left; name + `(role)` and the white pill **Log out**
  (salmon text) right. Pages below keep the warm-grey background.
- **Home pages** — centred `PageCard`: ink "Welcome back, {name}" heading and
  the muted sub-line; HR's reset link in salmon.
- `/hr/password-reset` — `PageCard` with the user table: hairline row separators,
  muted column headings, salmon pill **Reset password** buttons.
- **403 screen** — `PageCard`, centred: muted "403", ink heading "you don't have
  access to this page", muted explanation, salmon "Go to my home page" link.

---

# Leave Request – Design

> **This file answers:** How is the leave module put together? (data, rules,
> screens, where the code lives)
> **Who:** The AI drafted it from the HRMS document (§5, §6, §7.2) and the
> interview decisions D1–D9 / A1–A3 of 20/11/2026 (requirements §8).
>
> Section numbers continue from the login part; §1–§8 above are unchanged.
> This part covers U11–U24 and AC-16–AC-34 of `01-requirements.md`.

## 9. Leave tables

### `LeaveRequest` – one row per request (HRMS doc §7.2)

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `employeeId` | number | yes | Link to `User` — the employee who asked (their own rows only, rule L2) |
| `supervisorId` | number | yes | Link to `User` — the **named** supervisor; must be role `Supervisor` in the employee's division at submit time (rule L3) |
| `signedById` | number | no | Link to `User` — the supervisor who **actually** signed; may differ from `supervisorId` (D6). Set only at signing (rule L6) |
| `leaveType` | text | yes | One of the five values in **Reference C** |
| `otherLeaveType` | text | only when `leaveType = Other` | What the leave is for (doc §7.2; rule L3) |
| `note` | text | no | The optional free-text note on every request (D7) |
| `startDate` | date | yes | First day of leave; past dates allowed (D4) |
| `endDate` | date | yes | Last day of leave; never before `startDate` (rule L3) |
| `status` | text | yes | One of the six values in **Reference D** (doc §5.2) |
| `supervisorRemark` | text | only on rejection by supervisor | The supervisor's reason (doc §7.2; rule L6) |
| `hrOfficerId` | number | only once HR decides | Link to `User` — the HR officer who approved or rejected (doc §7.2; rule L8) |
| `hrRemark` | text | only on HR rejection | HR's reason (doc §7.2; rule L8) |
| `submittedAt` | date | auto | Set when the request is created |
| `signedAt` | date | auto at signing | Set when the supervisor signs |
| `decidedAt` | date | auto at a final status | Set when Approved / Rejected by supervisor / Rejected by HR |

In Prisma: model `LeaveRequest` with four relations to `User`
(`employee`, `supervisor`, `signedBy`, `hrOfficer`). `status` and `leaveType`
are stored as text constrained to Reference C/D — the same "fixed list checked
server-side" pattern as roles and divisions (Reference A). The **working-day
count** (D3) is *not* stored: it is derived by `workingDays(start, end)`
counting Mon–Fri days inclusive, so a weekend-only request shows **0 working
days** and stays legal. Leave rows are created by hand during testing — the
seed keeps loading only the six Reference B people.

## 10. Status machine (doc §5.2)

| From | Action (who may, rule) | To | Fields set |
|------|------------------------|----|------------|
| — | Submit (the employee, L3) | `PendingSupervisor` | `submittedAt` |
| `PendingSupervisor` | Edit (owner, L5) | `PendingSupervisor` | changed form fields (L3/L4 re-checked) |
| `PendingSupervisor` | Cancel/delete (owner, L5) | row deleted | — |
| `PendingSupervisor` | Sign (supervisor of the division, L6) | `Signed` | `signedBy`, `signedAt` |
| `PendingSupervisor` | Reject + remark (supervisor of the division, L6) | `RejectedBySupervisor` | `supervisorRemark`, `decidedAt` — final (D2) |
| `Signed` | Send to HR (owner, L7) | `PendingHR` | — |
| `PendingHR` | Approve (any HR officer, L8) | `Approved` | `hrOfficer`, `decidedAt` — final |
| `PendingHR` | Reject + remark (any HR officer, L8) | `RejectedByHR` | `hrRemark`, `hrOfficer`, `decidedAt` — final (D2) |

No action exists out of the four final statuses, and no one — not even HR or
Admin — edits a record outside its allowed window.

## 11. Leave business rules (L1–L12)

1. **L1 — Access gate.** Every leave page and every leave server action starts
   with `requireUser([...])` from login rule 1/6: `/employee*` Employee,
   `/supervisor` Supervisor, `/hr*` HR, `/admin` Admin. Session or role wrong →
   redirect or 403, no leave data shown (reuses `Forbidden`).
2. **L2 — Ownership.** Employee actions (edit, cancel, send to HR) apply only to
   the signed-in user's own rows; the check runs in the server action against
   the database row, never against a form field (AC-32).
3. **L3 — Submission checks** (doc FR-02, D4, D7). Server-side: `leaveType` in
   Reference C; `endDate ≥ startDate` (past dates fine); the chosen supervisor
   has role `Supervisor` **and the employee's division** — a tampered form
   naming anyone else is refused (AC-17); `otherLeaveType` required iff type is
   Other; `note` optional. The **edit** action re-runs every check in this rule
   plus L4 on the submitted values — the form validates on the server at both
   submit and edit, never only in the browser (AC-22).
4. **L4 — No overlap** (D8). A create or edit is refused when the same employee
   already has an open request that overlaps: open = `PendingSupervisor`,
   `Signed` or `PendingHR`; overlap = `newStart ≤ existing.end AND
   existing.start ≤ newEnd`. Approved/Rejected never block. Message: "You
   already have a request covering those dates" (AC-21).
5. **L5 — Edit/cancel window** (D1). Only the owner, only while
   `PendingSupervisor`. The buttons appear only on such rows *and* the server
   action refuses any other status (AC-22, AC-23).
6. **L6 — Supervisor decision** (FR-03, D6). Actor must be role `Supervisor`
   whose `division` equals the named supervisor's division, and the request must
   be `PendingSupervisor`. Sign sets `signedBy` (who actually signed) and
   `signedAt`. Reject needs a non-empty `supervisorRemark` and is final (D2).
7. **L7 — Send to HR** (FR-04). Only the owner, only while `Signed`; the request
   then joins the shared HR queue (doc rule 5).
8. **L8 — HR decision, first wins** (FR-05, A1). Actor must be role `HR`; the
   update is executed *conditionally on the status still being `PendingHR`* —
   if zero rows change, the answer is "This request has already been decided"
   and the stored decision is never overwritten (AC-30). Approve sets
   `hrOfficer` + `decidedAt`; reject also needs a non-empty `hrRemark`.
9. **L9 — Working-day count** (D3). `workingDays(start, end)` counts Mon–Fri
   days inclusive and is shown in every list as "N working day(s)". Never
   stored.
10. **L10 — Scoped lists** (FR-06, A2). Employee → own rows; Supervisor → rows
    whose **named supervisor** shares the actor's division (all statuses); HR →
    every row; Admin → every row. All newest-`submittedAt`-first, full history,
    no pagination. A list never shows remarks or fields of rows outside its
    scope.
11. **L11 — View-only admin** (FR-08, D9). `/admin` renders a table plus two
    dropdown filters — status, and the **requesting employee's** division
    (`?status=` and `?division=` via search params). There is no admin write
    action at all — not hidden, it does not exist.
12. **L12 — Confirm first, success after** (FR-07, A3). All eight actions
    (submit, edit, cancel, send to HR, sign, supervisor reject, HR approve, HR
    reject) get the login pattern: browser confirmation before anything is sent
    — a cancel sends nothing — and a flash success message after (AC-34).

## 12. Screens (routes)

Same look as §8 (cards, salmon buttons, flash messages). "To do" until built.

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/employee` | Employee | Home card (kept) plus **New leave request** button and the own-requests list per L10/L9: type (+ other text), dates, working days, status badge, named supervisor, remarks. Row buttons per L5/L7: **Edit**, **Cancel** (PendingSupervisor) and **Send to HR** (Signed) | To do |
| `/employee/leave/new` | Employee | `LeaveForm` card: leave type dropdown (Reference C); a description field that appears and is required when Other (AC-19); start/end date fields; supervisor dropdown listing exactly the own-division supervisors (AC-17); optional note; **Submit** with "Submit this leave request?" (L12). Errors above the button | To do |
| `/employee/leave/[id]/edit` | Employee | The same `LeaveForm` prefilled, only for own `PendingSupervisor` rows — otherwise redirect to `/employee` with a message; **Save changes** confirms (L5) | To do |
| `/supervisor` | Supervisor | Home card (kept) plus the division's list per L10: `PendingSupervisor` rows on top, each with **Sign** and **Reject** (reject opens an inline remark field that must not be empty, L6); current and past division requests below, newest first | To do |
| `/hr` | HR | Home card + reset link (kept) plus the HR queue per L10: `PendingHR` rows on top with **Approve** and **Reject** (inline remark required, L8); current and past requests below. A decision attempt on an already-decided row shows "This request has already been decided" (L8) | To do |
| `/admin` | Admin | One read-only table of every request (L10/L11): employee name, employee's division, type (+ other text), dates, working days, status, remarks, named supervisor, signer, HR officer, submitted/signed/decided dates. Two dropdown filters — status, and the employee's division — driven by the URL query; **Log out** stays the only button | To do |

## 13. Who can do what

| Action | Who may (server-side check in `src/lib/leave.ts`) | Ref |
|--------|---------------------------------------------------|-----|
| Submit a request | Employee; own record; all L3 checks re-run server-side | U11, AC-16–19 |
| Edit / cancel a request | Owner, only `PendingSupervisor` | U15, AC-22–23 |
| Sign / reject | Supervisor in the named supervisor's division, only `PendingSupervisor`; reject needs a remark | U16–U17, AC-24–26 |
| Send to HR | Owner, only `Signed` | U18, AC-27 |
| Approve / reject (HR) | Any HR officer, only `PendingHR`, first decision wins; reject needs a remark | U19–U21, AC-28–30 |
| See lists / admin table | Per L10 scope; Admin read-only | U22–U23, AC-31–33 |

## 14. Where the leave code lives

| Folder / file | New or update | What's in it |
|---------------|---------------|--------------|
| `prisma/schema.prisma` | update | Adds the `LeaveRequest` model of §9 (four `User` relations) |
| `src/lib/leave.ts` | new | The one place leave touches the database: Reference C/D constants, `workingDays`, the L4 overlap query, scoped list queries, and one function per action — `createLeave`, `editLeave`, `cancelLeave`, `signRequest`, `rejectBySupervisor`, `sendToHr`, `approveRequest`, `rejectByHr` — each starting with `requireUser` and enforcing L2–L8 |
| `src/app/employee/page.tsx` | update | Adds the **New leave request** link and the own-requests list with row buttons |
| `src/app/employee/leave/new/page.tsx` | new | The form page |
| `src/app/employee/leave/new/actions.ts` | new | `submitLeave` server action — `requireUser(["Employee"])` then `leave.ts` |
| `src/app/employee/leave/[id]/edit/page.tsx` | new | The prefilled edit page |
| `src/app/employee/leave/actions.ts` | new | `editLeave`, `cancelLeave`, `sendToHr` server actions — each re-checks owner + status (L2, L5, L7) |
| `src/app/supervisor/page.tsx` | update | Division list with **Sign** / **Reject** + remark field |
| `src/app/supervisor/actions.ts` | new | `signRequest`, `rejectRequest` — division + status checks (L6) |
| `src/app/hr/page.tsx` | update | HR queue with **Approve** / **Reject** + remark field |
| `src/app/hr/actions.ts` | new | `approveRequest`, `rejectRequest` — HR role + conditional first-decision update (L8) |
| `src/app/admin/page.tsx` | update | Read-only table + status/division filters from search params (L11) |
| `src/components/LeaveForm.tsx` | new | The shared new/edit form (dropdowns from Reference C, own-division supervisors, note, Other description) |
| `src/components/LeaveList.tsx` | new | The shared request table row set used by the four role lists |
| `src/components/StatusBadge.tsx` | new | Displays Reference D labels as a small coloured pill |
| `src/components/FlashMessage.tsx` | reuse | The L12 success/error messages |

## 15. Leave security notes (OWASP, doc §7.5 / FR-10)

- **Access control (A01).** Every action in §13 is a server action whose first
  lines are `requireUser` plus the L2/L6/L8 ownership, division and status
  checks against the **database row**, so a tampered form id or status field
  changes nothing (AC-32). The admin write path does not exist (L11).
- **Injection (A03).** Only Prisma queries, never string SQL; `status` and
  `leaveType` are matched against the Reference C/D fixed lists before use.
  Remarks and notes are rendered as React text (auto-escaped) — no HTML or
  script can ride in on a remark.
- **Data exposure (A01/A05).** Scoped lists (L10) are the privacy rule: a
  supervisor page never renders another division's rows; the 403 screen shows no
  data. Failure messages name only the refused rule, never another user's data.
- **Session reuse.** Leave adds no new identity path — it trusts only the
  login cookie; every page/action re-reads it (rule 1 of the login part).

---

# Reference

## Reference A. Fixed lists

- **Roles:** `Employee`, `Supervisor`, `HR`, `Admin` — one per user, never more.
- **Divisions:** Finance, Human Resources, Information Technology, Operations, Marketing
- **Designations:** Finance → Finance Manager, Accountant, Accounts Clerk; Human
  Resources → HR Manager, HR Officer, HR Assistant; Information Technology → IT
  Manager, Software Developer, IT Support Officer; Operations → Operations Manager,
  Operations Supervisor, Operations Executive; Marketing → Marketing Manager,
  Marketing Executive, Marketing Assistant
- **Email domain:** `@budiman.com`

## Reference B. Demo data (from HRMS doc §7.2)

| Email | Name | IC No. | Role | Division | Designation |
|-------|------|--------|------|----------|-------------|
| `employee1@budiman.com` | Employee 1 | 00-148888 | Employee | Finance | Accounts Clerk |
| `supervisor1@budiman.com` | Supervisor 1 | 00-157777 | Supervisor | Finance | Finance Manager |
| `supervisor2@budiman.com` | Supervisor 2 | 00-166666 | Supervisor | Finance | Accountant |
| `hr-1@budiman.com` | HR 1 | 00-175555 | HR | Human Resources | HR Officer |
| `hr-2@budiman.com` | HR 2 | 00-184444 | HR | Human Resources | HR Officer |
| `admin@budiman.com` | Admin | 00-193333 | Admin | Admin | Admin Manager |

Every demo account uses the password `password123`, hashed by bcryptjs at seed time.
Made-up names and IC numbers, as the document states; the Admin's "Admin" division
has no designations of its own beyond Admin Manager.

## Reference C. Leave types (HRMS doc §7.2) — added with the leave module

| Stored value | What it is | `otherLeaveType` |
|--------------|-----------|------------------|
| `Annual leave` | Yearly paid leave | — |
| `Maternity leave` | For employees who are expecting or have just given birth | — |
| `Unpaid leave` | Leave without pay | — |
| `Compassionate leave` | For a family emergency or bereavement | — |
| `Other` | Anything else — the employee must write what it is for | **required** |

## Reference D. Request statuses (HRMS doc §5.2) — added with the leave module

| Stored value | Label shown | Meaning |
|--------------|-------------|---------|
| `PendingSupervisor` | Pending supervisor | Submitted. Waiting for the supervisor |
| `Signed` | Signed | The supervisor signed it; the employee can send it to HR |
| `PendingHR` | Pending HR | Sent to HR. Waiting for a decision |
| `Approved` | Approved | HR approved it. Final |
| `RejectedBySupervisor` | Rejected by supervisor | The supervisor rejected it, with a remark. Final |
| `RejectedByHR` | Rejected by HR | HR rejected it, with a remark. Final |
