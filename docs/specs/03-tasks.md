# Login – Tasks

> **This file answers:** In what order do we build it, and how do we check each step?
> **Who:** The AI drafts it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes its
> Status to Done. At the end, you check the whole app against the specs.
> If something is wrong, fix the spec first, then ask the AI to rebuild.

**Priority.** Every task is **High**, **Medium** or **Low**. Do High first.
Do Low only if time is left, and only if you ask.

Every task traces back to `01-requirements.md` (U / AC ids) and `02-design.md`
(§ and rule numbers). Demo accounts and `password123` are from design Reference B.

| Status | # | Task | Priority | Checks (from requirements §4) |
|--------|---|------|----------|-------------------------------|
| Done | 1 | Database and the Users table | High | AC-14 (part) |
| Done | 2 | Seed the six demo users | High | AC-14 |
| Done | 3 | The sign-in form and the session cookie | High | AC-01 (part), AC-02, AC-03, AC-04, AC-05, AC-07, AC-12 |
| Done | 4 | Role home pages, top bar and the access gate | High | AC-01, AC-08, AC-09, AC-10, AC-15 |
| Done | 5 | Log out | High | AC-11 |
| Done | 6 | Throttle failed attempts | High | AC-06 |
| Done | 7 | HR resets a password | Medium | AC-13 |
| Done | 8 | Full acceptance walkthrough | High | AC-01 … AC-15 |

---

## Task 1 – Database and the Users table *(High)*

- **Goal:** `npx prisma migrate dev` creates `dev.db` with the `User` table exactly as the design specifies, and `npx prisma studio` can open it.
- **Files:** `prisma/schema.prisma`, `.env` (datasource URL + `SESSION_SECRET` placeholder), `.env.example`; run `npx prisma init` first.
- **Trace:** design §1 (`User` table), §3 (Secret row), §7 (init/migrate commands); prerequisite for AC-14.
- **Check:**
  • Run `npx prisma migrate dev --name init` with no errors
  • Open `npx prisma studio` → the Users table exists with all nine fields from design §1 (`name`, `icNumber`, `email`, `password`, `role`, `division`, `designation`, `createdAt`, plus `id`)
  • The table is empty — seeding is Task 2, and nothing has been created through the app

## Task 2 – Seed the six demo users *(High)*

- **Goal:** `npx prisma db seed` loads the six people from design Reference B, each password hashed by bcryptjs (cost 10) at seed time.
- **Files:** `prisma/seed.ts` (and the seed config in `package.json` that `npx prisma db seed` needs).
- **Trace:** requirements U1, AC-14; design §1 (last paragraph), rule 3, Reference B; HRMS doc §7.2 demo table (emails, IC numbers, roles, divisions, designations).
- **Check:**
  • Run `npx prisma db seed`, then open `npx prisma studio` → Users
  • Six rows: `employee1@`, `supervisor1@`, `supervisor2@`, `hr-1@`, `hr-2@`, `admin@budiman.com` — names, IC numbers, roles, divisions and designations match Reference B
  • Every password column shows a hash starting with `$2b$`; searching the table for `password123` finds nothing (this is AC-14)

## Task 3 – The sign-in form and the session cookie *(High)*

- **Goal:** `/login` can sign a demo user in: email and password are checked on the server, the "Sign in as {email}?" confirmation comes first, and success sets the signed session cookie (8 h, or 30 days with Remember me) and lands on a simple `Signed in as {name}` page.
- **Files:** `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/lib/session.ts`, `src/lib/users.ts`, `src/components/FlashMessage.tsx`, temporary content in `src/app/page.tsx` (Task 4 replaces it).
- **Trace:** requirements U1, U5, U7, U8, AC-01 (part), AC-02, AC-03, AC-04, AC-05, AC-07, AC-12; design rules 2, 3, 4, 5 (message), 7, screen `/login`, files `login/*`, `session.ts`, `users.ts`, `FlashMessage.tsx`.
- **Check:**
  • Open `/login`: email field, masked password field, "Remember me" tick, **Sign in** button
  • Sign in as `employee1@budiman.com` / `password123` → "Sign in as employee1@budiman.com?" appears — accept, and the page shows "Signed in as Employee 1"
  • Cancel the confirmation instead → you stay on `/login` and are not signed in (AC-07)
  • Enter `  Employee1@BudiMan.COM ` with the right password → signed in anyway (AC-02)
  • Wrong password, and then an unknown `@budiman.com` email → the same "Incorrect email or password" both times (AC-03, AC-04)
  • `someone@gmail.com` → "Email must end with @budiman.com" — and still shown with JavaScript disabled in dev tools (AC-05)
  • Dev tools → Application → Cookies: cookie is `HttpOnly`; expiry ≈ 8 h without Remember me, ≈ 30 days with it (AC-12)

## Task 4 – Role home pages, top bar and the access gate *(High)*

- **Goal:** the four home pages exist and show the signed-in user's name, role, a **Log out** button and a "Welcome back, {name}" message; the `requireUser` gate redirects strangers to `/login` and wrong roles to the 403 screen, on every page and action.
- **Files:** `src/app/employee/page.tsx`, `src/app/supervisor/page.tsx`, `src/app/hr/page.tsx`, `src/app/admin/page.tsx`, `src/lib/auth.ts`, `src/components/TopBar.tsx`, `src/components/Forbidden.tsx`, `src/app/layout.tsx`, `src/app/page.tsx` (real redirect replaces the Task 3 placeholder).
- **Trace:** requirements U2, U3, U4, U10, AC-01, AC-08, AC-09, AC-10, AC-15; design rules 1 and 6, screens `/`, `/employee`, `/supervisor`, `/hr`, `/admin` and the 403 screen, files `auth.ts`, `TopBar.tsx`, `Forbidden.tsx`; HRMS doc FR-01 and business rule 1.
- **Check:**
  • Sign in with each of the six demo accounts → each lands on its own home (`/employee`, `/supervisor`, `/hr`, `/admin`) with "Welcome back, {name}" (AC-01)
  • Top bar shows name, role and a **Log out** button on every page of your own area (AC-15)
  • Private window, go straight to `/employee`, `/hr`, `/admin` → redirected to `/login` (AC-08)
  • Signed in as `employee1@budiman.com`, open `/hr`, `/supervisor`, `/admin` → 403 screen with no HR or supervisor data on it; repeat with `hr-1` opening `/supervisor` (AC-09)
  • While signed in, open `/login` → bounced to your own home (AC-10)
  • Also open a home URL *while signed out* and as the wrong role by typing it directly, not by clicking — the gate must not depend on the top bar

## Task 5 – Log out *(High)*

- **Goal:** the top-bar **Log out** button asks "Are you sure?", then clears the cookie, lands on `/login` with "You have been logged out", and the back button no longer opens app pages.
- **Files:** `src/components/TopBar.tsx` (button + confirmation), `src/app/login/actions.ts` (sign-out action), `src/lib/session.ts` (clear), `src/app/login/page.tsx` (shows the message).
- **Trace:** requirements U6, AC-11; design rule 7, `TopBar.tsx` row, cookie rule 4; HRMS doc business rule 7; interview decision 5.
- **Check:**
  • Sign in as any demo account, press **Log out**, choose No at "Are you sure?" → still signed in
  • Press **Log out** again and confirm → `/login` shows "You have been logged out"
  • Press the browser Back button and open `/employee` directly → redirected to `/login`, the page does not open

## Task 6 – Throttle failed attempts *(High)*

- **Goal:** sign-in attempts are counted per IP in memory; from the 6th attempt inside 15 minutes the server refuses with "Too many attempts — try again in 15 minutes", even for a correct password. Restarting the dev server clears the counters.
- **Files:** `src/lib/throttle.ts`, `src/app/login/actions.ts` (check before verifying, record after a failure).
- **Trace:** requirements U5, AC-06; design rule 5, `throttle.ts` row; interview decision 2 (per-IP throttle, not account lockout); design §6 OWASP A07.
- **Check:**
  • Try `employee1@budiman.com` with a wrong password five times → five "Incorrect email or password" messages
  • Sixth attempt with the **correct** password → "Too many attempts — try again in 15 minutes", no sign-in
  • A cancelled sign-in confirmation does not consume one of the five attempts (it never reaches the server — AC-07)
  • Stop and restart `npm run dev` → the correct sign-in works again

## Task 7 – HR resets a password *(Medium)*

> **Spec amendment approved 20/11/2026** (the note above U9 in
> `01-requirements.md`): this exceeds the document's role table, cleared to build.

- **Goal:** `/hr/password-reset` lists every user; **Reset password** on a row confirms "Reset {name}'s password to password123?", resets it (hashed), and shows a success message — HR only, enforced on the server.
- **Files:** `src/app/hr/password-reset/page.tsx`, `src/app/hr/password-reset/actions.ts`, `src/lib/users.ts` (list + update), a link from the `/hr` home.
- **Trace:** requirements U9, AC-13; design rule 8, screen `/hr/password-reset`, files `hr/password-reset/*`; interview decision 6.
- **Check:**
  • Developer opens `npx prisma studio` → Users → change `employee1`'s password field to anything else
  • `employee1@budiman.com` / `password123` now fails with "Incorrect email or password"
  • Sign in as `hr-1@budiman.com` → the `/hr` home links to the reset page → pick **Employee 1** → confirm the reset → a success message appears
  • `employee1@budiman.com` / `password123` signs in again
  • Sign in as `supervisor1@budiman.com` and open `/hr/password-reset` → 403
  • Tamper with a reset request (browser dev tools, another user's id) — the server action still runs `requireUser(["HR"])` first and refuses

## Task 8 – Full acceptance walkthrough *(High)*

- **Goal:** the finished login module passes every check in `01-requirements.md` §4, in one sitting, exactly as written — plan step 6 "Check" from the HRMS document.
- **Files:** none new — this task only runs the checks; any failure means fixing the spec first, then the code.
- **Trace:** requirements §4 (all rows), HRMS doc §8 plan step 6.
- **Check:**
  • Walk AC-01 … AC-15 top to bottom, with a private browser window open for the not-signed-in tests
  • Tick each row's Status from "To do" to Done in `01-requirements.md` as it passes
  • Anything that fails: fix the requirement or design first, then the code, then re-run that row

---

**Build order:** 1 → 2 → 3 → 4 → 5 → 6, then 7 once the spec amendment is approved,
then 8 last. The High tasks (1–6, 8) come before the Medium one (7); there is no
Low task in this module — U10 (name in the top bar) is small enough to ride along
inside Task 4.

---

# Leave Request – Tasks

> **This file answers:** In what order do we build the leave module, and how do we
> check each step? (continued — leave part)
> **Who:** The AI drafted it. You review it.
>
> Build one task at a time, in order, High first. When a task is done, the AI
> changes its Status to Done. Anything that fails: fix the spec first, then the
> code.

Traces: `01-requirements.md` leave part (U11–U24, AC-16–AC-34, decisions
D1–D9/A1–A3) and `02-design.md` leave part (§9–§15, rules L1–L12, References
C/D). The login tasks above are Done and untouched.

| Status | # | Task | Priority | Checks (from requirements §10) |
|--------|---|------|----------|-------------------------------|
| To do | 1 | Database: the `LeaveRequest` table | High | AC-16 (part), AC-19 (part) |
| To do | 2 | The leave rules library (`src/lib/leave.ts`) | High | proven by Tasks 3–7 (AC-20, AC-21, AC-24–26, AC-30) |
| To do | 3 | Employee: the new-request form | High | AC-16, AC-17, AC-18, AC-19, AC-34 (submit) |
| To do | 4 | Employee: list, edit and cancel | High | AC-20, AC-21, AC-22, AC-23, AC-34 (edit, cancel) |
| To do | 5 | Supervisor: sign and reject | High | AC-24, AC-25, AC-26, AC-34 (sign, reject) |
| To do | 6 | Employee: send a Signed request to HR | High | AC-27, AC-34 (send) |
| To do | 7 | HR: approve, reject, first decision wins | High | AC-28, AC-29, AC-30, AC-31, AC-32 |
| To do | 8 | Admin: the read-only record view with filters | Medium | AC-33 |
| To do | 9 | Full acceptance walkthrough (leave) | High | AC-16 … AC-34 |

---

## Task 1 – Database: the `LeaveRequest` table *(High)*

- **Goal:** `npx prisma migrate dev` adds a `LeaveRequest` table exactly as design
  §9 specifies, with its four links to `User`, without touching the login data.
- **Files:** `prisma/schema.prisma` (add the model; `User` gains the four named
  relations).
- **Trace:** design §9, Reference D; HRMS doc §7.2 (leave request fields) and §5.2
  (statuses); foundation for AC-16, AC-19, and every later AC.
- **Check:**
  • Run `npx prisma migrate dev --name add_leave_request` with no errors
  • `npx prisma studio` → `LeaveRequest` exists with every field from design §9
    (`employeeId`, `supervisorId`, `signedById`, `leaveType`, `otherLeaveType`,
    `note`, `startDate`, `endDate`, `status`, `supervisorRemark`, `hrOfficerId`,
    `hrRemark`, `submittedAt`, `signedAt`, `decidedAt`, plus `id`)
  • The table is empty — leave rows are made by hand during testing, the seed is
    unchanged (the six users still sign in exactly as before)

## Task 2 – The leave rules library *(High)*

- **Goal:** `src/lib/leave.ts` is the single home of the leave rules: Reference C/D
  constants, `workingDays` (L9), the overlap query (L4), the four scoped list
  queries (L10), and the eight action functions of design §14 — each starting with
  `requireUser` and enforcing L2–L8, including the conditional first-decision
  update (L8/A1).
- **Files:** `src/lib/leave.ts`.
- **Trace:** design rules L1–L12, §13, §14; decisions D1–D8, A1.
- **Check:**
  • `npm run lint` passes and the login pages still work (nothing imported from
    the login side was edited)
  • Every action function's first executable line is `requireUser` (L1); the role
    check, owner/division/status checks and the fixed-list validation all live in
    this file, not in a page
  • The behaviour itself is proven by the UI tasks: working-day count (AC-20),
    overlap (AC-21), division signing (AC-25), first decision wins (AC-30),
    tampering (AC-32)

## Task 3 – Employee: the new-request form *(High)*

- **Goal:** `/employee/leave/new` matches design §12: type dropdown from Reference
  C (description appears and is required for Other), start/end dates, supervisor
  dropdown of the own division only, optional note, and **Submit** behind a browser
  confirmation that creates a `PendingSupervisor` row and shows the success message.
- **Files:** `src/app/employee/leave/new/page.tsx`, `src/app/employee/leave/new/actions.ts`,
  `src/components/LeaveForm.tsx`, a **New leave request** link on
  `src/app/employee/page.tsx`.
- **Trace:** requirements U11, U12, U24 (submit); design §12 `/employee/leave/new`,
  §14 rows; rules L1, L3, L12; decisions D4, D7; AC-16–AC-19.
- **Check:**
  • As `employee1@budiman.com`: submit Annual leave, next Mon–Fri, Supervisor 1,
    with a note → "Leave request submitted" and the row exists in Prisma Studio
    as `PendingSupervisor` with those values (AC-16)
  • The supervisor dropdown shows only Supervisor 1 and Supervisor 2; a dev-tools
    tamper submitting `hr-1` as supervisor is refused server-side (AC-17)
  • End before start → "End date cannot be before the start date", still refused
    with JavaScript disabled (AC-18)
  • Other with no description → refused; with description → stored in
    `otherLeaveType` (AC-19)
  • Cancelling the submit confirmation sends nothing and creates no row (AC-34)

## Task 4 – Employee: list, edit and cancel *(High)*

- **Goal:** `/employee` lists the employee's own requests newest first with the
  status badge, remarks and working-day count (L9/L10); **Edit** and **Cancel**
  exist only on `PendingSupervisor` rows and are enforced again in the actions.
- **Files:** `src/app/employee/page.tsx`, `src/app/employee/leave/[id]/edit/page.tsx`,
  `src/app/employee/leave/actions.ts`, `src/components/LeaveList.tsx`,
  `src/components/StatusBadge.tsx`.
- **Trace:** requirements U13, U14, U15, U24 (edit, cancel); design §12 `/employee`
  and the edit route; rules L2, L3 (re-run on edit), L4, L5, L9, L10, L12;
  decisions D1, D8; AC-20–AC-23.
- **Check:**
  • Sat→Mon shows **1 working day**, Wed→Wed **1**, Sat→Sun **0** (still allowed)
    (AC-20)
  • Submitting or editing into overlap with one's own open request → "You already
    have a request covering those dates", no row created; the same dates pass
    once the first request is Approved (AC-21)
  • Edit a Pending row → saved; a Signed row shows no Edit/Cancel; a crafted edit
    call against a Signed row is refused (AC-22)
  • An edit that sets the end date before the start is refused with AC-18's
    message, still refused with JavaScript disabled — the edit action re-runs
    the L3 checks on the server (AC-22)
  • Cancel with the confirmation → success message and the row is gone in Prisma
    Studio (AC-23)

## Task 5 – Supervisor: sign and reject *(High)*

- **Goal:** `/supervisor` shows the division's requests per L10; **Sign** (confirm
  → success) records `signedBy`/`signedAt` and moves the row to `Signed`;
  **Reject** requires an inline remark and moves it to `RejectedBySupervisor`
  (final). Any supervisor of the division may act, even on a request named for a
  colleague (D6).
- **Files:** `src/app/supervisor/page.tsx`, `src/app/supervisor/actions.ts`.
- **Trace:** requirements U16, U17, U24 (sign, reject); design §12 `/supervisor`,
  §13; rules L1, L6, L10, L12; decisions D2, D6; AC-24–AC-26.
- **Check:**
  • `supervisor1@budiman.com` signs the Pending request → success, `Signed`,
    Studio shows `signedBy` = Supervisor 1 (AC-24)
  • `supervisor2@budiman.com` signs a request named for Supervisor 1 → allowed;
    named supervisor stays Supervisor 1, `signedBy` is Supervisor 2 (AC-25)
  • Reject with a blank remark → "A remark is required"; with a remark →
    **Rejected by supervisor**, remark visible to Employee 1, row has no further
    buttons (AC-26)
  • Confirmations: cancelling Sign or Reject changes nothing (AC-34); a crafted
    sign/reject call against a `PendingHR` or another division's row is refused
    (part of AC-32)

## Task 6 – Employee: send a Signed request to HR *(High)*

- **Goal:** **Send to HR** appears only on the owner's `Signed` rows; after the
  confirmation the status becomes `PendingHR` and the success message shows.
- **Files:** `src/app/employee/leave/actions.ts` (extend),
  `src/app/employee/page.tsx` (button), reusing `LeaveList`/`FlashMessage`.
- **Trace:** requirements U18, U24 (send); design §12, §13; rules L2, L7, L12;
  HRMS doc rule 5 (shared HR queue); AC-27.
- **Check:**
  • On a Signed row, press **Send to HR** → confirm → "Sent to HR" and status
    **Pending HR** (AC-27)
  • No other status shows the button; a crafted send call on a `PendingSupervisor`
    or another user's row is refused
  • Cancelling the confirmation leaves the row `Signed` (AC-34)

## Task 7 – HR: approve, reject, first decision wins *(High)*

- **Goal:** `/hr` shows the full queue per L10; **Approve** and **Reject** (inline
  remark required) decide `PendingHR` rows, recording `hrOfficer`/`decidedAt`; the
  conditional update makes the first decision win and tells a late officer "This
  request has already been decided".
- **Files:** `src/app/hr/page.tsx`, `src/app/hr/actions.ts`.
- **Trace:** requirements U19, U20, U21, U22; design §12 `/hr`, §13; rules L1,
  L8, L10, L12; decisions A1, A2, D2; AC-28–AC-32.
- **Check:**
  • `hr-1@budiman.com` approves → **Approved**, Studio shows `hrOfficer` = HR 1,
    `decidedAt` set (AC-28)
  • Reject with blank remark refused; with remark → **Rejected by HR**, remark +
    officer visible to the employee (AC-29)
  • hr-1 and hr-2 open the same queue row; hr-1 approves first, hr-2's attempt →
    "This request has already been decided", record still shows HR 1 (AC-30)
  • Scope: Employee 1 sees only own rows; Supervisor 2 sees the division's rows
    incl. those named for Supervisor 1; HR 2 sees every pending row — all newest
    first with remarks (AC-31); crafted out-of-scope calls refused (AC-32)

## Task 8 – Admin: the read-only record view with filters *(Medium)*

- **Goal:** `/admin` renders every request as one table, newest submitted first,
  with status and division dropdown filters driven by the URL query, per D9/L11 —
  and contains no way to change data.
- **Files:** `src/app/admin/page.tsx`, reusing `LeaveList`/`StatusBadge`.
- **Trace:** requirements U23; design §12 `/admin`, rules L10, L11; HRMS doc
  FR-08; AC-33.
- **Check:**
  • `admin@budiman.com` opens `/admin` → every request, newest first, with all the
    §12 columns (AC-33)
  • Status filter = Approved → only approved rows; plus Division filter = Finance
    → only Finance rows; clearing returns the full table
  • No button on any row mutates data — verify before/after in Prisma Studio;
    a hand-crafted POST to any leave action with the admin cookie is refused
    (wrong role)

## Task 9 – Full acceptance walkthrough (leave) *(High)*

- **Goal:** the finished leave module passes every leave check in
  `01-requirements.md` §10, in one sitting, exactly as written — plan step 6
  "Check" from the HRMS document.
- **Files:** none new — this task only runs the checks; any failure means fixing
  the spec first, then the code.
- **Trace:** requirements §10 (AC-16 … AC-34), decisions D1–D9/A1–A3; HRMS doc §8.
- **Check:**
  • Walk AC-16 … AC-34 top to bottom, keeping a Prisma Studio window open for the
    data checks and a second browser profile for the two-officer test (AC-30)
  • Tick each row's Status from "To do" to Done in `01-requirements.md` as it
    passes
  • Anything that fails: fix the requirement or design first, then the code, then
    re-run that row

---

**Build order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 (all High — the request walks through
the system in that order: table, rules, submit, own list, sign, send, decide),
then 8 (Medium, admin view), then 9 last. The story is that a request can only be
acted on in the order the workflow defines, so the tasks follow the same walk.
There is no Low task in this module (FR-09 extras stay out of scope).
