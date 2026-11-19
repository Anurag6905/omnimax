# Context for Claude Code

Project: replacement for Omnimax, a financial planning tool used by Indian financial advisers (INR, SIPs, EPF/PPF/NPS).

- Monorepo with npm workspaces: `apps/web` (Next.js, App Router, Tailwind, shadcn/ui, Recharts), `apps/api` (NestJS), `packages/shared` (types), `packages/engine` (calc engine).
- Current phase is **1A: UI only, with sample data**. Do not build the calculation engine or real persistence until Phase 1B starts.
- `db/schema.sql` is the data model. `packages/shared/src/index.ts` must stay in step with it.
- Input screens follow the five tabs of `reference/2025-10-01_Client Data Gathering Sheet.xlsx`: Personal Details, Goals, Assets, Liabilities, Insurance.
- Allocation logic: `reference/Input_Allocations.py` (8 levels, Priority Goal 1/2/3 per investment, equal split across eligible investments). Never invent or simplify calculation rules; ask instead.
- Never commit real client data or `.env`.
