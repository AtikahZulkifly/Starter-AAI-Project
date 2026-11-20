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
