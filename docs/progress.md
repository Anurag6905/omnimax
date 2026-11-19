# Progress log

## Phase 1A — User interface

### Done
- [x] Repository scaffold (web, api, shared, engine, db, docs)
- [x] Database schema drafted from the Client Data Gathering Sheet (`db/schema.sql`, 13 tables) and tested on PostgreSQL 16
- [x] Design system: colour and type tokens (`apps/web/src/app/globals.css`), UI parts (`components/ui`), reference page at `/design-system`
- [x] App layout: sidebar with role-aware menu, top bar with account menu, mobile drawer
- [x] Sign-in at `/login` with demo accounts for adviser, operations and admin (password `demo1234`)
- [x] Roles and permissions (`lib/roles.ts`); staff and roles page at `/admin/users` (admin only)
- [x] Client list at `/clients`: search by name, code, PAN, mobile or email; filter by status, adviser, residence; add client
- [x] Client profile at `/clients/[id]`: household facts, household life line, family table, add/edit/remove members, edit household
- [x] Eight fictional sample households (`lib/sample-data.ts`)
- [x] Checked: build, lint, screenshots at desktop and phone width, all three roles

### Next
- [ ] Remaining profile tabs: income and expenses, goals, assets, liabilities, insurance
- [ ] Assumptions, results, dashboard and what-if screens (static sample results)
- [ ] Adviser review and sign-off

### Open questions
- Role rules in `lib/roles.ts` are a proposal (advisers see only their own clients; operations see all; only admins delete or manage staff). Confirm with the advisory team.
- Age uses the data sheet's formula: this year minus birth year. Confirm Omnimax does the same (it can differ from exact age by one year).
- See also "Questions to confirm" in the database doc.

### Bugs
None open.
