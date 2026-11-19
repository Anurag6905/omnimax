# Omnimax Replacement

Web-based financial planning tool for advisers, replacing Omnimax. It keeps Omnimax's goal-funding logic and fixes its slow screens, hidden calculations and manual what-ifs.

**Current phase: 1A — User interface** (screens with sample data, adviser sign-off).

## Structure

```
omnimax/
├── apps/
│   ├── web/          Next.js + React + TypeScript + Tailwind  ← Phase 1A work happens here
│   └── api/          NestJS backend (skeleton; wired up in Phase 1B)
├── packages/
│   ├── shared/       TypeScript types that mirror the database tables
│   └── engine/       Calculation engine (Phase 1B — empty for now)
├── db/
│   └── schema.sql    PostgreSQL schema: 13 tables from the Client Data Gathering Sheet
├── docs/             Schema guide, decisions log, progress log
├── reference/        Source files: client data sheet, Input_Allocations.py
├── scripts/          One-time GitHub setup scripts
└── docker-compose.yml  Local PostgreSQL
```

## Prerequisites

- Node.js 22+ (`node -v`)
- Git
- Docker Desktop (only needed for the database)
- GitHub CLI `gh` (only for the one-time repo setup)

## First run

```bash
npm install                 # installs all apps and packages
cp .env.example .env        # then edit passwords
npm run dev                 # web app on http://localhost:3000
```

Optional:

```bash
npm run db:up               # PostgreSQL on localhost:5432, schema auto-loaded
npm run dev:api             # API on http://localhost:3000 (set PORT=4000 to run beside web)
```

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| 1A | All screens, auth and roles UI, sample data, adviser approval | **In progress** |
| 1B | Database, calculation engine, allocation logic, regression tests | Not started |
| 2  | Insurance calculator, SIP for unfunded goals, launch | Not started |

## Rules for this codebase

- The allocation method in `reference/Input_Allocations.py` is the source of truth. Do not simplify it.
- Money is never a float in the database (`numeric(18,2)`); rates are stored as percents.
- Real client data never goes into git. Use sample data only.
- Record decisions in `docs/decisions.md` and progress in `docs/progress.md`.
