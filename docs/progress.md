# Progress log

## Phase 1A — User interface

### Done
- [x] Repository scaffold (web, api, shared, engine, db, docs)
- [x] Database schema drafted from the Client Data Gathering Sheet (`db/schema.sql`, 13 tables) and tested on PostgreSQL 16
- [x] Design system: colour and type tokens (`frontend/src/app/globals.css`), UI parts (`components/ui`), reference page at `/design-system`
- [x] App layout: sidebar with role-aware menu, top bar with account menu, mobile drawer
- [x] Sign-in at `/login` with demo accounts for adviser, operations and admin (password `demo1234`)
- [x] Roles and permissions (`lib/roles.ts`); staff and roles page at `/admin/users` (admin only)
- [x] Client list at `/clients`: search by name, code, PAN, mobile or email; filter by status, adviser, residence; add client
- [x] Client profile at `/clients/[id]`: household facts, household life line, family table, add/edit/remove members, edit household
- [x] Eight fictional sample households (`frontend/src/data/sample-data.ts`)
- [x] Checked: build, lint, screenshots at desktop and phone width, all three roles
- [x] Profile tabs for the whole data sheet: Family, Income and expenses, Goals, Assets (9 sections), Liabilities (loans + credit cards), Insurance (health status, life, general)
- [x] Goal order (funding priority 1..n) with move up/down; "Reserved for" Priority Goal 1/2/3 on every asset and income
- [x] Full sample data for the Sharma family covering every sheet section; other households empty to show empty states
- [x] Inputs from the project plan: income growth, start year and end (at retirement / set year / for life); SIP and contribution stop (at retirement / set year); year an asset can be used from; inflation per goal
- [x] Firm assumptions page (`/assumptions`): returns by asset class over periods, inflation by goal type; admins edit, others view
- [x] Client Assumptions tab: firm defaults with per-plan overrides; "Tied to retirement" list shows every date that moves with a retirement age
- [x] Schema: 3 assumption tables + new income/asset columns (16 tables), tested on PostgreSQL 16
- [x] Plan results page (`/clients/[id]/results`), five views: Dashboard, Cash flow, Goal funding, Who pays for what (with investment ledger), Net worth. Sharma family only, with illustrative figures and a banner saying so
- [x] `PlanResults` type in `packages/shared`: the output the Phase 1B engine must produce, shaped like the Omnimax output read by Input_Allocations.py
- [x] What-if page (`/clients/[id]/what-if`): create scenarios (retirement ages, returns, inflation, goal cost/timing/leave out), see which dates move with retirement, compare up to two with the plan (table + shortfall chart), make a scenario the plan
- [x] `scenarios` table (17 tables) and `Scenario` type: a scenario stores only its differences, so the plan is never overwritten (problem 13)
- [x] Two ready-made Sharma scenarios with sample figures: "Rahul retires at 58", "Lower equity returns"

### Next
- [ ] Adviser review and sign-off of all Phase 1A screens: run it with the review guide, https://claude.ai/artifact/Qaip7iDB4pV49Af2ekKVEQ (walkthrough, 14 decisions, what the firm must hand over for Phase 1B)

### Open questions
- Role rules in `lib/roles.ts` are a proposal (advisers see only their own clients; operations see all; only admins delete or manage staff). Confirm with the advisory team.
- Age uses the data sheet's formula: this year minus birth year. Confirm Omnimax does the same (it can differ from exact age by one year).
- Income per year uses amount × payments a year (12 / 2 / 1). The sheet's own Annually column is always Monthly × 12. Confirm Omnimax's rule for half-yearly and annual income.
- Goals carry both High/Medium/Low (from the sheet) and an order number (used for funding). How should H/M/L map to order?
- Vacation "Travelling Frequency" on the sheet is unlabelled; we read it as "every N years". Confirm.
- Floater health policies record one main insured person. Is that enough?
- Which return each asset section uses (Firm assumptions page, "Which return each asset uses") is a proposal.
- Firm return and inflation rates on screen are sample values; the firm must supply the real ones.
- Problem 11: keep Priority Goal 3 as a third reserved goal, or remove it? (Screens keep it for now.)
- Problem 14: should one investment be split across goals by percentage? (Not on screen yet.)
- What-if: should "Make it the plan" keep a copy of the old plan (plan history is Phase 1B)? Should scenarios also change SIP amounts or add new goals?
- See also "Questions to confirm" in the database doc.

### Bugs
None open.
