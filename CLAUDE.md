# Context for Claude Code

Project: replacement for Omnimax, a financial planning tool used by Indian financial advisers (INR, SIPs, EPF/PPF/NPS).

- Monorepo with npm workspaces: `frontend` (React with Next.js App Router, Tailwind; see frontend/README.md), `backend` (NestJS), `packages/shared` (types), `packages/engine` (calc engine).
- Current phase is **1B: backend and calculation engine** (started 2026-11-20). Phase 1A screens are built with sample data.
- `packages/engine/src/allocation.ts` is a faithful port of `reference/Input_Allocations.py`; it must keep matching it. Run `npm test -w @omnimax/engine` after any engine change. Fixes to known problems go in as separate options, never by editing the port's default behaviour.
- `docs/Input_Mapping.xlsx` maps every client-sheet input to the app. Keep it current: edit `scripts/input-mapping/build_input_mapping.py` and rerun it whenever an input field changes.
- `db/schema.sql` is the data model. `packages/shared/src/index.ts` must stay in step with it.
- Input screens follow the five tabs of `reference/2025-10-01_Client Data Gathering Sheet.xlsx`: Personal Details, Goals, Assets, Liabilities, Insurance.
- Allocation logic: `reference/Input_Allocations.py` (8 levels, Priority Goal 1/2/3 per investment, equal split across eligible investments). Never invent or simplify calculation rules; ask instead.
- Never commit real client data or `.env`.
