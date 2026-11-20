# Budiman HRMS – Leave Request module

## What this is

Web app replacing Budiman Company's paper leave process: employees submit leave
requests, supervisors sign or reject, HR approves or rejects, the admin only
views. The source of truth is `docs/Agentic AI - HRMS Doc.pdf` and the approved
specs in `docs/specs/`. To change behaviour, fix the spec first, then the code.

## Built with (fixed, do not swap)

Next.js 16 + TypeScript, SQLite via Prisma, Tailwind CSS 4, bcryptjs, signed
session cookie, server actions. Node 20.9+.

## Run it

- `npm install`, then `npm run dev` → http://localhost:3000; `npm run lint` to check.
- Prisma is not set up yet: `npx prisma init`, schema from the design spec, then
  migrate and seed the demo people.

## Where things live

- `docs/Agentic AI - HRMS Doc.pdf` – the document (database fields: section 7.2).
- `docs/templates/` – blank spec files; `docs/specs/` – approved specs:
  `01-requirements.md`, `02-design.md`, `03-tasks.md`.
- `src/app/` – App Router pages, layout, server actions.

## How to work

- Build one task at a time from `03-tasks.md`, High first, login first; a task is
  done when its checks in `01-requirements.md` §4 pass.
- Every page and every server action re-checks the session and the user's role.
- Hash passwords with bcryptjs, never plain text; demo password is `password123`.
- Follow the OWASP Top 10 everywhere (document section 7.5, FR-10).
- Ask permission before each commit. Every commit message uses Conventional
  Commits, e.g. `feat: add login page`, `fix: ...`, `docs: ...`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
