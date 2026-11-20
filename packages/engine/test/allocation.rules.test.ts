import { describe, expect, it } from "vitest";
import { GoalAllocationSystem, runAllocation, type AllocationInvestment } from "../src/allocation";

/**
 * The allocation rules in plain words, one test each. These document what
 * Input_Allocations.py does (including its quirks); the parity tests prove the
 * port matches it on hundreds of generated cases.
 */
const asset = (name: string, amount: number, year = 2030): AllocationInvestment => ({ name, year, amount, category: "Asset" });
const income = (name: string, amount: number, year = 2030): AllocationInvestment => ({ name, year, amount, category: "Income" });
const goal = (name: string, priority: number, amount: number, year = 2030) => ({ name, priority, year, amount });
const sys = () => new GoalAllocationSystem([], [], []);

describe("core split: smaller-than-average first, then equal shares", () => {
  it("splits equally when every investment can cover its share", () => {
    const [rest, left, allocs] = sys().allocateInvestmentToGoal(new Map([["A", 500], ["B", 500]]), 600, "L", "G", 2030);
    expect(allocs.map((a) => [a.investment, a.allocated])).toEqual([["A", 300], ["B", 300]]);
    expect(left).toBe(0);
    expect([...rest]).toEqual([["A", 200], ["B", 200]]);
  });

  it("uses up an investment smaller than the average share first, then splits the rest", () => {
    // need 900 from 3 → average 300; C has only 100, so it goes first; A and B then share 800
    const [, left, allocs] = sys().allocateInvestmentToGoal(new Map([["A", 1000], ["B", 1000], ["C", 100]]), 900, "L", "G", 2030);
    expect(allocs.map((a) => [a.investment, a.allocated])).toEqual([["C", 100], ["A", 400], ["B", 400]]);
    expect(left).toBe(0);
  });

  it("leaves a shortfall when investments run out", () => {
    const [rest, left] = sys().allocateInvestmentToGoal(new Map([["A", 100], ["B", 50]]), 1000, "L", "G", 2030);
    expect(left).toBe(850);
    expect(rest.size).toBe(0);
  });
});

describe("levels", () => {
  it("funds a reserved goal (Priority Goal 1) before goals in priority order", () => {
    const r = runAllocation(
      [goal("Retirement", 1, 1000), goal("House", 2, 500)],
      [asset("Fund", 500)],
      [{ name: "Fund", goal1: "House" }],
    );
    // Level 2: reserved for House even though Retirement has higher priority
    expect(r.detailed[0]).toMatchObject({ level: "Level 2", goal: "House", allocated: 500 });
    expect(r.unfulfilled).toEqual([{ year: 2030, goal: "Retirement", unfulfilledAmount: 1000 }]);
  });

  it("uses income before assets for the same reserved goal (levels 1 then 2)", () => {
    const r = runAllocation(
      [goal("Retirement", 1, 1000)],
      [asset("Fund", 1000), income("Pension", 300)],
      [{ name: "Fund", goal1: "Retirement" }, { name: "Pension", goal1: "Retirement" }],
    );
    expect(r.detailed.map((a) => [a.level, a.investment, a.allocated])).toEqual([["Level 1", "Pension", 300], ["Level 2", "Fund", 700]]);
  });

  it("treats 'Fund all other goals' as no reservation (levels 7 and 8)", () => {
    const r = runAllocation([goal("Car", 1, 200)], [asset("Savings", 500)], [{ name: "Savings", goal1: "Fund all other goals" }]);
    expect(r.detailed).toEqual([{ level: "Level 8", year: 2030, investment: "Savings", goal: "Car", allocated: 200, investmentBalance: 300 }]);
  });

  it("QUIRK (problem 11): ignores Priority Goal 3", () => {
    const r = runAllocation([goal("A", 1, 100), goal("B", 2, 100)], [asset("Fund", 100)], [{ name: "Fund", goal3: "B" }]);
    // Fund behaves as 'any goal' and pays the higher priority goal A first
    expect(r.detailed[0]).toMatchObject({ level: "Level 8", goal: "A" });
  });

  it("QUIRK: an investment missing from the priority sheet is never used at levels 5–8", () => {
    const r = runAllocation([goal("A", 1, 100)], [asset("Unlisted", 1000)], []);
    expect(r.detailed).toEqual([]);
    expect(r.unfulfilled).toEqual([{ year: 2030, goal: "A", unfulfilledAmount: 100 }]);
  });

  it("QUIRK: a year with goals but no withdrawals records no shortfall", () => {
    const r = runAllocation([goal("A", 1, 100, 2031)], [asset("Fund", 50, 2030)], [{ name: "Fund" }]);
    expect(r.unfulfilled).toEqual([]);
  });

  it("works year by year: money left in one year doesn't carry to the next", () => {
    const r = runAllocation(
      [goal("A", 1, 100, 2030), goal("A", 1, 100, 2031)],
      [asset("Fund", 1000, 2030), asset("Fund", 40, 2031)],
      [{ name: "Fund" }],
    );
    expect(r.unfulfilled).toEqual([{ year: 2031, goal: "A", unfulfilledAmount: 60 }]);
  });
});
