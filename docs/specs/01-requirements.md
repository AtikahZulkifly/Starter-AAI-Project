# Login – Requirements

> **This file answers:** What should the app do, and why?
> **Who:** The AI drafts it from your interview. You review it.
>
> When the app's behaviour needs to change, update this file **first**.

**Status:** Draft for review (interview of 20/11/2026). Covers the login module only;
the rest of FR-02 … FR-09 get their own requirement rows later.

## 1. The problem

The Leave Request app is worthless unless the system knows who is looking at it:
without a login, anyone could open the supervisor's sign-off page or HR's queue,
and the rule that each role sees only its own area (document rule 1) cannot hold.
Budiman's staff also share laptops, so a session must be quick to hand back and
safe to leave.

This module provides:

1. Sign in with a work email (`@budiman.com`) and a hashed password
2. A home page per role, with no other role's pages open to that user
3. Failures that give a stranger no hints, and repeated guessing throttled per IP
4. Logout with confirmation, and sessions that expire
5. A password reset that the two HR officers can perform

## 2. Who uses it (roles)

| Role | Home page | What they do |
|------|-----------|--------------|
| **Employee** | `/employee` | Signs in, sees their name and role in the top bar, logs out |
| **Supervisor** | `/supervisor` | Signs in, sees their name and role in the top bar, logs out |
| **HR** | `/hr` | As above, plus resets another user's password to `password123` |
| **Admin** | `/admin` | Signs in and logs out; the record view itself is a later module |

## 3. User stories

- **U1. Sign in** *(High)*. As a Budiman user, I can sign in with my work email and password so that the system knows who I am (FR-01). Pressing Sign in first asks me to confirm the account I am using; when it works I get a welcome message on my home page (rule 7).
- **U2. My own home page** *(High)*. As any role, I land on my own role's home page after signing in so that I start straight where I work (FR-01).
- **U3. No login, no app** *(High)*. As the company, nobody can open any app page without a valid session so that nothing is readable by strangers (rule 1).
- **U4. One role, one area** *(High)*. As a logged-in user, I cannot open another role's pages so that each person sees only what their role may see (rule 1, FR-01).
- **U5. Failures that leak nothing** *(High)*. As the company, a failed sign-in gives no hint about which emails exist, the email must end with `@budiman.com`, and repeated guesses from one computer are throttled so that staff accounts resist password guessing (FR-10, OWASP A07).
- **U6. Log out** *(High)*. As a user, I can log out after a "Are you sure?" confirmation so that a shared laptop never stays signed in to me.
- **U7. Sessions expire** *(High)*. As the company, every session ends on its own (signed cookie, 8 hours, `httpOnly`) so that a forgotten laptop cannot be used forever.
- **U8. Remember me** *(Medium)*. As a user on my own laptop, I can tick "Remember me" to stay signed in for 30 days so that I do not have to sign in every day.
- **U9. HR resets a password** *(Medium)*. As an HR officer, I can reset a colleague's password to `password123` so that locked-out staff are back working without the developer.
- **U10. See who I am** *(Low)*. As a logged-in user, I see my name and role in the top bar of every page so that I always know I am signed in as the right person.

> **Spec amendment (for U9):** the document's role table (section 4) says HR only
> decides leave requests. The HR password reset was agreed in the interview of
> 20/11/2026 and exceeds that table. **Approved 20/11/2026** — cleared to build.

## 4. Acceptance checklist

All demo accounts use the password `password123`: `employee1@budiman.com`,
`supervisor1@budiman.com`, `supervisor2@budiman.com`, `hr-1@budiman.com`,
`hr-2@budiman.com`, `admin@budiman.com`. "Signed in as X" below means a successful
sign-in with that demo account.

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| Done | AC-01 | Every demo account signs in, confirms, and lands on its own home page with a welcome message | • Open http://localhost:3000 and follow the link to `/login`<br>• Sign in as `employee1@budiman.com` / `password123`, press **Sign in**<br>• A confirmation asks "Sign in as employee1@budiman.com?" — accept it<br>• You should see the `/employee` home page with "Welcome back, Employee 1"<br>• Repeat for all six demo accounts: each lands on its own home (`/employee`, `/supervisor`, `/hr`, `/admin`) |
| Done | AC-02 | The email is trimmed and lowercased before checking | • On `/login` type `  Employee1@BudiMan.COM ` (spaces and mixed case)<br>• Enter the correct password and confirm the sign-in<br>• You should still sign in as Employee 1 |
| Done | AC-03 | A wrong password gives one generic error | • Sign in as `employee1@budiman.com` with password `wrongpass`<br>• You should see "Incorrect email or password" — the message must not say the password is wrong |
| Done | AC-04 | An unknown email gives the same generic error | • Sign in as `nosuchperson@budiman.com` / `password123`<br>• The message should be word-for-word the same as AC-03 |
| Done | AC-05 | Only `@budiman.com` emails are accepted, and the check is not only in the browser | • Sign in as `someone@gmail.com` with any password<br>• You should see "Email must end with @budiman.com" without the form being submitted<br>• In the browser's dev tools, disable JavaScript and try the same sign-in<br>• You should still get the same message, proving the server checks it too |
| Done | AC-06 | A fifth failure from the same computer throttles further attempts for 15 minutes | • Sign in as `employee1@budiman.com` with a wrong password, five times<br>• On the sixth attempt enter the **correct** password<br>• You should see "Too many attempts — try again in 15 minutes" and no sign-in<br>• Stop and restart `npm run dev`; a correct sign-in should now work again |
| Done | AC-07 | Cancelling the sign-in confirmation leaves you signed out | • Press **Sign in** with correct details, then cancel the "Sign in as…?" confirmation<br>• You should stay on `/login`<br>• Now open `/employee` directly<br>• You should be redirected to `/login` |
| Done | AC-08 | Nobody can open app pages without signing in | • Open a private/incognito window<br>• Go straight to http://localhost:3000/employee<br>• You should land on `/login` instead; repeat for `/hr` and `/admin` |
| Done | AC-09 | Another role's pages show a 403 screen | • Sign in as `employee1@budiman.com`<br>• Open `/hr` directly — you should see the 403 "you don't have access" screen, with no HR data on it<br>• Repeat for `/supervisor` and `/admin`<br>• Sign in as `hr-1@budiman.com` and open `/supervisor` — 403 again |
| Done | AC-10 | An already signed-in user is bounced off `/login` | • While signed in as `employee1@budiman.com`, open `/login`<br>• You should arrive on `/employee`, not the login form |
| Done | AC-11 | Logout asks first, then really ends the session | • While signed in, press **Log out** — you should be asked "Are you sure?"; choose No and check you are still signed in<br>• Press **Log out** again and confirm<br>• You should land on `/login` with "You have been logged out"<br>• Press the browser Back button and try to open `/employee`<br>• You should be redirected to `/login`, not see the page |
| Done | AC-12 | The session cookie is HttpOnly and expires on time | • Sign in as `employee1@budiman.com` **without** Remember me; open the browser's dev tools → Application → Cookies<br>• The session cookie should be `HttpOnly` and expire about 8 hours later<br>• Log out, sign in again **with** Remember me<br>• The cookie should now expire about 30 days later |
| Done | AC-13 | Only HR can reset a password, and the reset works | • Developer changes `employee1`'s stored password to anything else in Prisma Studio (`npx prisma studio` → Users → `employee1`)<br>• `employee1@budiman.com` / `password123` should now fail with "Incorrect email or password"<br>• Sign in as `hr-1@budiman.com`, open the password-reset page under `/hr`, pick **Employee 1**, press **Reset** and confirm — you should see a success message<br>• `employee1@budiman.com` / `password123` should now sign in<br>• Sign in as `supervisor1@budiman.com` and open the reset page — 403 |
| Done | AC-14 | Passwords are stored hashed, never plain text | • Run the seed, then open Prisma Studio (`npx prisma studio`) → Users<br>• The password column should show bcrypt hashes starting with `$2b$` (bcryptjs 3.x always writes `$2b$`; amended 20/11/2026, the check is the same: bcrypt hash, never plain text)<br>• `password123` must not appear anywhere in the table |
| Done | AC-15 | The top bar shows who is signed in | • Sign in as any demo account and visit any page of your own area<br>• The top bar should show your name and role, and a **Log out** button |

## 5. Not included (for now)

- Self sign-up — accounts exist only through the seed; the HR reset (U9) is the agreed exception
- "Forgot password" emails or reset links — the system has no email server
- Users changing their own password — the HR reset to `password123` covers lock-outs
- Locking an *account* after wrong attempts — the per-IP throttle (AC-06) was agreed instead
- Multi-factor sign-in and CAPTCHAs
- A server-side session store or revoking one person's session — the signed cookie is stateless by design (document §7.1)
- Audit log of sign-ins and failed attempts
- HTTPS setup — the app runs on localhost; the cookie is sent `secure` when the app is later served over HTTPS

---

# Leave Request – Requirements

> **This file answers:** What should the app do, and why? (continued — leave module)
> **Who:** The AI drafted it from the HRMS document and the interview of 20/11/2026.
> You review it.
>
> **Status:** Draft for review. Covers FR-02 … FR-08 and the leave half of FR-07.
> The login sections above are built — every check in §4 reads Done — and are
> untouched here; section numbers continue (this module's stories are U11–U24,
> its checks AC-16–AC-34).

## 6. The problem

The paper form becomes three decisions on screen: the employee applies to a
supervisor of their own division, the supervisor signs or rejects with a reason,
and HR approves or rejects with a reason. This module puts the whole journey in
one system (doc §3): every request is a row from submission to decision, each
role sees only what it must act on, and the status and remarks are always
visible so nothing gets lost.

## 7. Who uses it (roles)

| Role | Leave pages | What they do with leave |
|------|-------------|-------------------------|
| **Employee** | `/employee`, `/employee/leave/new`, `/employee/leave/[id]/edit` | Submits a request, edits or cancels it while Pending supervisor, tracks every own request, sends a Signed request to the HR queue |
| **Supervisor** | `/supervisor` | Signs or rejects (remark required) the division's Pending supervisor requests |
| **HR** | `/hr` | Approves or rejects (remark required) the shared HR queue; the officer who decides is recorded |
| **Admin** | `/admin` | Sees every request, view only, filterable by status and division |

## 8. Interview decisions (20/11/2026)

Agreed in the interview of 20/11/2026; the design rules and checks below trace
to these.

- **D1.** The employee can edit the form and cancel (delete) the request only
  while it is *Pending supervisor*; once Signed, the record is locked.
- **D2.** Rejection is final. A retry is a brand-new request; rejected records
  stay visible with their remark.
- **D3.** The system counts the days of a request **excluding Saturdays and
  Sundays** and shows that count. A single day (start = end) is fine. Public
  holidays are not modelled.
- **D4.** Retroactive requests are allowed — past dates are accepted; the only
  date rule is end ≥ start.
- **D5.** No leave quotas in v1 — the supervisor and HR decide each case.
- **D6.** Any supervisor in the employee's division may sign or reject, not just
  the named one; the system also records **which supervisor actually signed**.
- **D7.** One optional free-text **note** on every request, for any leave type.
- **D8.** Overlapping dates are refused: a new request or an edit is blocked if
  it overlaps the same employee's own open requests (Pending supervisor, Signed,
  Pending HR). Approved and Rejected never block.
- **D9.** The admin page is one table of every request, newest submitted first,
  with dropdown filters for status and division.
- **A1.** (agreed default) First decision wins: once a request is decided, a
  second officer/supervisor's attempt is refused with a clear message, never
  overwriting.
- **A2.** (agreed default) Every role's list shows current and past requests,
  newest submitted first, full history, no pagination.
- **A3.** (agreed default) Confirmations and success messages follow the login
  module's pattern (browser confirmation, then flash message) for every leave
  action, as doc rule 7 / FR-07 requires.

## 9. User stories

Each story has a priority and a hand test; the full step-by-step checks are
AC-16 … AC-34 in §10.

- **U11. Apply for leave** *(High, FR-02)*. As an Employee, I can fill a leave
  request — leave type, start and end date, a supervisor from my own division,
  and an optional note — and submit it after a confirmation, so that my request
  is in the system the moment I hand it in (D7).
  *Test by hand:* sign in as `employee1@budiman.com` → **New leave request** on
  `/employee` → Annual leave, next Mon–Fri, Supervisor 1, a note → Submit
  (confirm) → success message and the row listed as **Pending supervisor**
  (AC-16, AC-17).
- **U12. The form guards the basics** *(High, FR-02)*. As the company, the
  request is refused when the end date is before the start date, when type
  **Other** has no description, or when a tampered form names a supervisor from
  another division — checked on the server, not only in the browser (D4 keeps
  past dates legal). *Test by hand:* AC-18, AC-19, and the tamper half of AC-17.
- **U13. The days are counted for me** *(High, FR-02, D3)*. As an Employee, the
  list tells me how many working days (Mon–Fri) each request covers, so nobody
  counts weekends by hand. *Test by hand:* book Sat→Mon and the list says
  **1 working day**; book one Wednesday and it says **1** (AC-20).
- **U14. No double-booking** *(High, D8)*. As the company, a request whose
  dates overlap one of my own open requests is refused, so no one is
  double-booked against themselves. *Test by hand:* with a request open, submit
  an overlapping one → refused with a clear message and no row created; the same
  overlap is allowed once the first request is Approved (AC-21).
- **U15. Fix or withdraw before the supervisor sees it** *(High, D1)*. As an
  Employee, I can edit any field or cancel the request while it is still Pending
  supervisor; from Signed onwards the record is locked. *Test by hand:* edit the
  dates of a Pending request and cancel another after a confirmation; after
  signing, the buttons are gone and crafted requests are refused (AC-22, AC-23).
- **U16. The supervisor signs** *(High, FR-03, D6)*. As a Supervisor, I see my
  division's Pending supervisor requests and sign them after a confirmation; any
  supervisor of the division may act, and the one who signed is recorded.
  *Test by hand:* Supervisor 2 signs a request named for Supervisor 1 — allowed,
  and the record keeps Supervisor 1 as the named supervisor and shows
  Supervisor 2 as the signer (AC-24, AC-25).
- **U17. A rejection needs a reason** *(High, FR-03, D2)*. As a Supervisor, I
  must write a remark to reject; the employee then reads it and the record is
  final. *Test by hand:* reject with a blank remark → refused; with a remark →
  **Rejected by supervisor**, remark visible to the employee (AC-26).
- **U18. Send the signed form to HR** *(High, FR-04)*. As an Employee, once my
  request is **Signed** I press **Send to HR** (with a confirmation) and it joins
  the shared HR queue. *Test by hand:* the button appears only on Signed rows;
  after pressing it the status is **Pending HR** (AC-27).
- **U19. HR approves** *(High, FR-05)*. As an HR officer, I approve a Pending HR
  request after a confirmation, and the system records that I decided.
  *Test by hand:* `hr-1@budiman.com` approves → status **Approved**, record shows
  HR 1 as the officer (AC-28).
- **U20. HR rejects with a reason** *(High, FR-05, D2)*. As an HR officer, I
  cannot reject without a remark; the record is then final and the employee sees
  the remark. *Test by hand:* blank remark refused; with remark → **Rejected by
  HR** with officer and remark visible (AC-29).
- **U21. One decision, first one wins** *(High, A1)*. As the company, when two
  officers (or supervisors) open the same request, only the first decision is
  kept and the second is told it has already been decided. *Test by hand:*
  hr-1 approves; hr-2's approve attempt is refused and the record still shows
  HR 1 (AC-30).
- **U22. Each role sees its own queue** *(High, FR-06, A2)*. As any role, I see
  my relevant requests — own (Employee), division (Supervisor), everything
  (HR/Admin) — with status, remarks and the working-day count, newest first.
  *Test by hand:* the three lists side by side; another employee's rows never
  appear for me; crafted actions on rows outside my scope are refused (AC-31,
  AC-32).
- **U23. The admin sees all records** *(Medium, FR-08, D9)*. As the Admin, I see
  every leave record, newest first, filtered by status and division, and I can
  change nothing. *Test by hand:* `/admin` table + both filters narrow
  correctly; no action buttons anywhere (AC-33).
- **U24. Confirm first, success after** *(High, FR-07, A3)*. As any user, every
  leave action asks "Are you sure?" before it is sent and shows a success
  message afterwards; cancelling changes nothing. *Test by hand:* cancel each of
  the eight actions, then perform each one (AC-34).

## 10. Acceptance checklist

All rows use the demo accounts of §4 (password `password123`). "The request
form" means `/employee` → **New leave request** (`/employee/leave/new`).

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| Done | AC-16 | Submitting creates a Pending supervisor record | • Sign in as `employee1@budiman.com`, open the form, choose **Annual leave**, next Mon–Fri, Supervisor 1, type a note, press **Submit**, accept the confirmation<br>• You should see "Leave request submitted" and the row on `/employee` marked **Pending supervisor**<br>• `npx prisma studio` → LeaveRequest: one row with those values |
| Done | AC-17 | Only own-division supervisors can be chosen, and the server re-checks | • Open the form as Employee 1 (Finance): the supervisor dropdown lists **Supervisor 1 and Supervisor 2 only**<br>• With dev tools, submit the form with `hr-1`'s id as supervisor → the server refuses with an error and no row appears in Prisma Studio |
| Done | AC-18 | End before start is refused, on the server too | • Set end yesterday, start today → "End date cannot be before the start date"<br>• Disable JavaScript in dev tools and repeat → still refused |
| Done | AC-19 | Type **Other** must say what it is for | • Choose Other, leave the description blank → refused with a message<br>• Fill the description → accepted; Prisma Studio shows `otherLeaveType` |
| Done | AC-20 | Working-day count excludes Sat/Sun | • Book Sat → Mon → the list shows **1 working day**<br>• Book Wed → Wed → **1 working day**; book Sat → Sun → **0 working days** (still allowed) |
| Done | AC-21 | Overlapping open requests are refused (D8) | • With a Pending request covering 5–9 Dec, submit 7–8 Dec → refused "You already have a request covering those dates", no new row<br>• Edit the first request to overlap another open one → also refused<br>• Approve the first fully, then submit 7–8 Dec again → accepted |
| Done | AC-22 | Edit works only while Pending supervisor, and re-validates | • On a Pending row press **Edit**, change the dates → saved and shown<br>• On the edit form set the end date before the start and save → "End date cannot be before the start date" — the form's rules (AC-17–AC-19) are re-checked on an edit, not only on a first submit<br>• Get a request to Signed → no **Edit**/**Cancel** buttons on it<br>• Craft an edit request for a Signed row (dev tools) → refused |
| Done | AC-23 | Cancel removes the request while Pending supervisor | • Press **Cancel** on a Pending row, accept "Cancel this request?" → success message, the row is gone (also in Prisma Studio)<br>• A Signed row has no **Cancel** button |
| Done | AC-24 | The named supervisor signs | • Sign in as `supervisor1@budiman.com`: the request appears on `/supervisor`<br>• Press **Sign**, accept → success message, status **Signed**<br>• Prisma Studio: `signedBy` = Supervisor 1, `signedAt` set |
| Done | AC-25 | Any division supervisor may sign (D6) | • Sign in as `supervisor2@budiman.com` and sign a request named for Supervisor 1 → allowed<br>• The record still shows named supervisor = Supervisor 1 and `signedBy` = Supervisor 2 |
| Done | AC-26 | Supervisor rejection needs a remark and is final | • Press **Reject**, leave the remark blank → refused with "A remark is required"<br>• Fill the remark → status **Rejected by supervisor**; Employee 1 sees the remark in the list<br>• No further buttons on the row for anyone |
| Done | AC-27 | The employee sends a Signed request to HR | • On a Signed row of `/employee`, **Send to HR** is visible → press it, accept → success, status **Pending HR**<br>• No other status shows the button |
| Done | AC-28 | HR approves and is recorded | • Sign in as `hr-1@budiman.com`: the Pending HR request is on `/hr`<br>• Press **Approve**, accept → success, status **Approved**<br>• Prisma Studio: `hrOfficer` = HR 1, `decidedAt` set |
| Done | AC-29 | HR rejection needs a remark and records the officer | • Press **Reject** with a blank remark → refused<br>• Fill the remark → status **Rejected by HR**; the employee's list shows the remark and HR 1 as the deciding officer |
| Done | AC-30 | First decision wins (A1) | • Sign in as both `hr-1` and `hr-2` (two browser profiles)<br>• hr-1 approves; hr-2 presses **Approve** on the still-open page → "This request has already been decided" and the record still shows HR 1 |
| Done | AC-31 | Lists are scoped per role (FR-06, A2) | • Employee 1's `/employee` list shows only Employee 1's rows (make a second request via Prisma Studio for another user to confirm)<br>• Supervisor 2's list shows the division's requests including those named for Supervisor 1; HR 2's list shows every pending request<br>• All lists are newest submitted first and show status + remarks |
| Done | AC-32 | Strangers' actions are refused server-side | • With a second signed-in profile, craft calls to all eight actions — submit, edit, cancel, sign, supervisor reject, send to HR, HR approve, HR reject (dev tools) — against rows you do not own, outside your division, or in the wrong status → each refused with an error, record unchanged |
| Done | AC-33 | Admin sees everything, filters, changes nothing (Medium) | • Sign in as `admin@budiman.com`, open `/admin` → every request, newest first<br>• Filter status = **Approved** → only approved rows; add division = **Finance** → only Finance rows<br>• No button on any row changes data; the DB is unchanged afterwards |
| Done | AC-34 | Every action confirms first and says success after (FR-07) | • For each action — submit, edit, cancel, send to HR, sign, supervisor reject, HR approve, HR reject — open the confirmation and press **Cancel** → the record is untouched<br>• Perform the same action and accept → a success message is shown |

## 11. Not included (for now)

- Leave quotas or entitlement balances — supervisors and HR decide each case (D5)
- A public-holiday calendar, or blocking dates that fall on weekends — only the
  working-day **count** excludes Sat/Sun (D3)
- Email or in-app notifications — the lists are the notification (doc FR-06)
- Print/PDF of a request
- Reopening or editing a rejected request — a retry is a new request (D2)
- Delegate/inbox UI — division-wide signing (D6) already covers an absent supervisor
- Pagination — full history, newest first (A2)
- Admin or HR editing request fields — decisions only, and admin is view-only (FR-08)
- An audit trail beyond the recorded signer and deciding officer
- Cover for a division with **no Supervisor** or a supervisor who changes
  division after being named: the dropdown is simply empty and the server
  refuses any submit whose supervisor fails L3; the demo data has two
  supervisors in Finance and two HR officers, so the flow always works. No
  reassignment or delegation UI — v1 assumes divisions are stable
