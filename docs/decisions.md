# Technical decisions

Newest first. One entry per decision: what, why, alternatives.

## 2026-11-19 — Profile tabs
- **One reusable `RecordSection` component** (`frontend/src/components/records/record-section.tsx`) draws every list on the profile: a table, an add/edit dialog, validation, totals and goal reservations. Each tab only describes its fields and columns. Reason: 14 sections with the same behaviour; one place to fix bugs.
- Expenses and credit cards are fixed question sets, so they have their own small panels instead.
- **Goal reservations** are edited on the asset or income ("Priority goal 1/2/3"), matching the Investments sheet that `Input_Allocations.py` reads, and shown in reverse on the Goals tab.
- Health status lives on family members (as in the schema) and is shown read-only on the Insurance tab.
- Only sums appear on screen (column totals, education annual cost × years, monthly × 12, as the sheet does). No growth, inflation or funding is calculated in Phase 1A.
- Profile tab is kept in the URL hash (`#goals`) so refresh and shared links open the same tab.

## 2026-11-19 — Phase 1A front end foundations
- **Look:** white theme, navy ink text (#14213D), one accent, ledger green (#0F6B5C). IBM Plex Sans with even-width figures so amounts line up. Borders rather than shadows. Tokens live in `globals.css`; `/design-system` shows them.
- **Own small components** instead of a UI kit: Button, Input, Select, Field, Badge, Dialog, Avatar, Panel. Fewer dependencies and they match the tokens exactly. shadcn/ui can still be added later.
- **Sign-in and data are mock in 1A:** demo accounts and sample data are kept in the browser (localStorage), behind `lib/auth.tsx` and `lib/store.tsx`. Phase 1B replaces those two files with API calls; screens stay the same.
- **Age** follows the data sheet formula `YEAR(TODAY()) - YEAR(DOB)` (`lib/format.ts`) until Omnimax's rule is confirmed.
- **Next.js `cacheComponents` turned off:** every screen is behind sign-in and per user, so static prerendering adds nothing and it required extra Suspense boundaries.
- **npm `legacy-peer-deps=true`** (`.npmrc`): works around an npm 10 bug with peer dependencies in workspaces.

## 2026-11-19 — Repository and stack
- **Monorepo** with npm workspaces (web, api, shared, engine). One clone, one install, shared types.
- **Stack** as in the project proposal: Next.js + TypeScript + Tailwind on the front end, NestJS backend, PostgreSQL 16.
- NestJS CLI now generates Vitest instead of Jest; we keep Vitest for the API and decide on the engine test runner in 1B.

## 2026-11-19 — Client data schema (13 tables)
- All nine asset sections go into **one `assets` table** keyed by `category`, not nine tables. Reason: net worth, asset allocation and investment-to-goal mapping all need "every asset" in one place. Alternative considered: parent + per-type detail tables; rejected as more joins for little gain.
- All six goal blocks go into **one `goals` table** keyed by `goal_type`.
- **`goal_funding_links`** holds Priority Goal 1/2/3 per asset *or* income stream, matching `Input_Allocations.py`. No row means "Fund all other goals".
- Goals keep both `priority_level` (H/M/L from the sheet) and `priority_rank` (ordinal used by the engine).
- Derived values (current age, annual amounts, totals) are computed, not stored.
- Dropdowns stored as text + CHECK constraints rather than Postgres enums, so lists can grow without migrations that lock tables.
