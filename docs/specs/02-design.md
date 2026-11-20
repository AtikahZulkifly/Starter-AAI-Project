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
