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
