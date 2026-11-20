/**
 * Omnimax calculation engine (Phase 1B).
 *
 * Done:
 *   - allocation.ts: goal allocation, a faithful port of reference/Input_Allocations.py,
 *     checked against the Python script on generated cases (test/parity).
 * Next (rules to be confirmed before building, see docs/progress.md):
 *   - cash flow, inflation-adjusted goal costs, investment growth with SIP step-ups,
 *     retirement-linked dates, then producing PlanResults for the screens.
 */
export * from "./allocation";
export const ENGINE_VERSION = "0.1.0";
