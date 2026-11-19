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

### Next
- [ ] Results screens: year-by-year cash flow, goal funding, which investment funds which goal, net worth and allocation (sample figures, clearly labelled)
- [ ] One-page dashboard
- [ ] What-if panel: change retirement age, rates or goals; save as a scenario; compare with the original
- [ ] Adviser review and sign-off

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
- See also "Questions to confirm" in the database doc.

### Bugs
None open.
