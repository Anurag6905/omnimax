import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runAllocation, type AllocationGoal, type AllocationInvestment, type PriorityMapping } from "../src/allocation";

/**
 * The TypeScript port must give exactly what reference/Input_Allocations.py gives.
 * fixtures/expected.json was produced by running the original Python class on
 * fixtures/cases.json (see test/parity/run_reference.py). Refresh with:
 *   npm run parity:refresh -w @omnimax/engine
 */
type Case = { id: number; goals: AllocationGoal[]; investments: AllocationInvestment[]; priorities: PriorityMapping[] };
type Expected = {
  id: number;
  detailed: unknown[];
  unfulfilled: unknown[];
  goalSummary: Array<{ year: number; key: string; allocated: number }>;
  investmentSummary: Array<{ year: number; key: string; allocated: number }>;
};

const dir = join(__dirname, "parity", "fixtures");
const cases: Case[] = JSON.parse(readFileSync(join(dir, "cases.json"), "utf8"));
const expected: Expected[] = JSON.parse(readFileSync(join(dir, "expected.json"), "utf8"));

/** pandas groupby-sum may add in a different order; allow a hair of floating-point difference. */
function closeTo(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

describe(`allocation matches Input_Allocations.py on ${cases.length} cases`, () => {
  it.each(cases.map((c, i) => [c.id, c, expected[i]] as const))("case %i", (_id, c, exp) => {
    const got = runAllocation(c.goals, c.investments, c.priorities);
    // every allocation, in order, to the last digit
    expect(got.detailed).toEqual(exp.detailed);
    // every unfulfilled goal, in order, to the last digit
    expect(got.unfulfilled).toEqual(exp.unfulfilled);
    // summaries: same groups in the same order, same totals
    for (const [mine, ref] of [[got.goalSummary, exp.goalSummary], [got.investmentSummary, exp.investmentSummary]] as const) {
      expect(mine.map((r) => [r.year, r.key])).toEqual(ref.map((r) => [r.year, r.key]));
      mine.forEach((r, j) => expect(closeTo(r.allocated, ref[j].allocated), `${r.year} ${r.key}: ${r.allocated} vs ${ref[j].allocated}`).toBe(true));
    }
  });
});
