# Technical decisions

Newest first. One entry per decision: what, why, alternatives.

## 2026-11-20 — Phase 1B starts with the allocation port
- **Build on the plans as given**; adviser sign-off runs alongside (project owner's decision).
- **Roles decided:** an adviser has full access to everything for their own clients; operations see every client; admin manages staff and firm assumptions. This is what was built.
- **Allocation first**, because it is the one rule set we have in full (`Input_Allocations.py`). Cash flow and growth rules need Omnimax outputs to check against.
- **Faithful port, quirks kept.** `allocation.ts` matches the Python class number for number, including behaviour listed as problems (Priority Goal 3 unused, investments missing from the priority sheet skipped at levels 5–8, no cross-year protection). Fixes will be separate options switched on after advisers decide, so the original behaviour stays available for checking against Omnimax.
- **Parity by running the original.** `test/parity/run_reference.py` loads the class straight from `reference/Input_Allocations.py` and writes expected results; the TypeScript tests must match exactly (summaries within 1e-9, as pandas sums in a different order). A mutation check showed the generated cases missed one tie-ordering branch, so hand-built edge cases were added.
- **Input mapping sheet is generated from a script** so every change to it is a reviewable diff in git.

## 2026-11-20 — What-if scenarios
- **A scenario stores only differences** from the plan (`scenarios.changes` jsonb: retirement ages, returns, inflation, per-goal changes). The plan is never overwritten by a what-if (problem 13); "Make it the plan" copies the changes in on purpose, after a confirmation.
- **Retirement-age changes reuse the plan's rules**: anything stored as "at retirement" moves with the new age, and the editor lists each date that moves (problems 1 and 12).
- **Compare = plan + up to two scenarios**, so the table stays readable. Each scenario value shows its change against the plan with "better/worse" in words, not colour alone.
- **Sample figures**: only the two ready-made Sharma scenarios have figures; new scenarios show their changes and "After engine" for results.
- **Sample generator adjusted**: it now saves 20% of pre-retirement surplus (100% after). The earlier version made "retire later" look worse for unrelated goals, which would mislead reviewers. This is a sample-making assumption only, not a calculation rule.
- **Dialogs render in a portal** and Escape closes only the focused dialog, so a dialog can open another (scenario editor → returns).
- Sidebar no longer lists Results and What-if: both live on each client (buttons on the profile).

## 2026-11-19 — Results screens before the engine exists
- **Results are read, never calculated, in the frontend.** `lib/results.ts` returns a `PlanResults` object; Phase 1B swaps its one function for the engine. Screens don't change.
- **`PlanResults` mirrors the Omnimax output** that `Input_Allocations.py` reads: per goal per year required/funded; per investment per year start value, contributions, earnings, withdrawals. This keeps the engine checkable against Omnimax.
- **Sample figures are one fixed file** (`frontend/src/data/sample-results.json`, Sharma family only), made once by a throwaway script that is deliberately not in the repo: it is not the calculation method. Every results screen shows a "Sample figures, not calculated" banner; other clients show an empty state.
- **Chart colours validated** with the dataviz checker (colour-blind separation and contrast on white). Funded/shortfall bars always show the % in text; every chart has a hover tooltip and a table nearby.
- Recharts added for charts (as in the project proposal).

## 2026-11-19 — Assumptions and retirement-linked dates
- Checked the screens against `Omnimax_Reverse_Project_Plan.docx` and `Omnimax Problem Analysis.docx`; added the inputs the plan lists that the data sheet lacks.
- **Returns are set per asset class over periods**, once per plan (problem 1). A period ends in a set year, at the main client's retirement, or runs to the end. Stored as `return_assumptions` rows.
- **A client's plan stores only overrides.** Anything not overridden falls back to the firm default, so changing a firm rate reaches every plan that hasn't changed it (CWA's one-file-per-client problem).
- **Dates tied to retirement are stored as a rule, not a year** (`end_rule = 'retirement'`), so changing a retirement age moves salary end, SIP stop, retirement goal start and return switches together (problems 1 and 12). The Assumptions tab lists them.
- **Inflation per goal type**, with an optional per-goal override (problem 9).
- Firm rates are labelled as samples on screen; the asset-section-to-asset-class mapping is labelled as a proposal.

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
