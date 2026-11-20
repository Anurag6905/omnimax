/**
 * Goal allocation — a faithful TypeScript port of GoalAllocationSystem in
 * reference/Input_Allocations.py. Do not "improve" this file: it must give the
 * same answers as the Python script, number for number. Behaviour that looks odd
 * is kept on purpose (marked QUIRK) and listed in docs/decisions.md; fixes for the
 * problems in "Omnimax Problem Analysis" will be separate, switchable options.
 *
 * Python dict -> Map (both keep insertion order; re-setting a key keeps its place,
 * delete + set moves it to the end). Python floats and JS numbers are both IEEE-754
 * doubles, and every arithmetic step happens in the same order, so results match exactly.
 */

/** One goal amount needed in one year ("Amount Required" in the Omnimax output). */
export interface AllocationGoal {
  /** "Goal name" */
  name: string;
  /** lower = funded first; null/undefined sorts last (as pandas does with NaN) */
  priority: number | null | undefined;
  year: number;
  /** "Amount" */
  amount: number;
}

/** Money available from one source in one year ("Withdrawals" in the Omnimax output). */
export interface AllocationInvestment {
  /** "Investments Name" */
  name: string;
  year: number;
  /** "Amount Withdrawn" */
  amount: number;
  /** The script guesses this from the words "income"/"pension" in the name (problem 8); here it is given. */
  category: "Income" | "Asset";
}

/** A row of the "Investments" sheet: Priority Goal 1/2/3 for one investment. */
export interface PriorityMapping {
  /** "Investments Name" */
  name: string;
  goal1?: string | null;
  goal2?: string | null;
  /** QUIRK (problem 11): read from the sheet but never used by the script. */
  goal3?: string | null;
}

export interface AllocationRecord {
  /** "Level 1" … "Level 8" */
  level: string;
  year: number;
  investment: string;
  goal: string;
  allocated: number;
  investmentBalance: number;
}

export interface UnfulfilledRecord {
  year: number;
  goal: string;
  unfulfilledAmount: number;
}

export interface SummaryRow {
  year: number;
  key: string;
  allocated: number;
}

export interface AllocationResult {
  detailed: AllocationRecord[];
  unfulfilled: UnfulfilledRecord[];
  /** detailed grouped by (year, goal), sorted like pandas groupby */
  goalSummary: SummaryRow[];
  /** detailed grouped by (year, investment), sorted like pandas groupby */
  investmentSummary: SummaryRow[];
}

const FUND_ALL = "Fund all other goals";

/** pd.isna(x) or x == '' or x == 'Fund all other goals' */
function isBlankGoal(g: string | null | undefined): boolean {
  return g == null || (typeof g === "number" && Number.isNaN(g)) || g === "" || g === FUND_ALL;
}

/** Python 3 string ordering (by code point), as pandas uses when sorting groups. */
function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class GoalAllocationSystem {
  private readonly goals: AllocationGoal[];
  private readonly investments: AllocationInvestment[];
  private readonly priorities: PriorityMapping[];
  readonly detailed: AllocationRecord[] = [];
  readonly unfulfilled: UnfulfilledRecord[] = [];

  constructor(goals: AllocationGoal[], investments: AllocationInvestment[], priorities: PriorityMapping[]) {
    this.goals = goals.map((g) => ({ ...g }));
    this.investments = investments.map((i) => ({ ...i }));
    this.priorities = priorities.map((p) => ({ ...p }));
  }

  /** Core rule: smaller-than-average investments are used up first, then the rest share the remainder equally. */
  allocateInvestmentToGoal(
    investmentAmounts: Map<string, number>,
    goalAmount: number,
    level: string,
    goal: string,
    year: number,
  ): [Map<string, number>, number, AllocationRecord[]] {
    if (goalAmount <= 0 || investmentAmounts.size === 0) return [investmentAmounts, goalAmount, []];

    const allocations: AllocationRecord[] = [];
    let remaining = new Map(investmentAmounts);
    let remainingGoal = goalAmount;

    while (remainingGoal > 0 && remaining.size > 0) {
      const avgRequired = remainingGoal / remaining.size;
      const small = [...remaining.entries()].filter(([, amount]) => amount < avgRequired);

      if (small.length > 0) {
        for (const [name, amount] of small) {
          const allocated = Math.min(amount, remainingGoal);
          allocations.push({ level, year, investment: name, goal, allocated, investmentBalance: amount - allocated });
          remainingGoal -= allocated;
          remaining.delete(name);
          if (remainingGoal <= 0) break;
        }
      } else {
        if (remaining.size > 0) {
          for (const [name, amount] of remaining) {
            const allocated = Math.min(avgRequired, amount, remainingGoal);
            allocations.push({ level, year, investment: name, goal, allocated, investmentBalance: amount - allocated });
            remaining.set(name, amount - allocated);
            remainingGoal -= allocated;
            if (remainingGoal <= 0) break;
          }
          remaining = new Map([...remaining].filter(([, v]) => v > 0));
        }
        break;
      }
    }
    return [remaining, remainingGoal, allocations];
  }

  /** The 8 levels for one year. */
  processYearAllocation(year: number): void {
    const yearGoals = this.goals.filter((g) => g.year === year);
    const yearInvestments = this.investments.filter((i) => i.year === year);
    // QUIRK: a year with goals but no withdrawals records no unfulfilled goals.
    if (yearGoals.length === 0 || yearInvestments.length === 0) return;

    const balanceIncome = new Map<string, number>();
    const balanceAsset = new Map<string, number>();
    for (const i of yearInvestments) (i.category === "Income" ? balanceIncome : balanceAsset).set(i.name, i.amount);
    const balanceGoals = new Map<string, number>();
    for (const g of yearGoals) balanceGoals.set(g.name, g.amount);

    // Levels 1–4: each investment's Priority Goal 1, then 2; income before assets.
    const reservedLevel = (level: string, pick: "goal1" | "goal2", balances: Map<string, number>, needsPositiveGoal: boolean) => {
      for (const row of this.priorities) {
        const pg = row[pick];
        if (isBlankGoal(pg)) continue;
        const goal = pg as string;
        if (!balances.has(row.name) || !balanceGoals.has(goal)) continue;
        // QUIRK: levels 1 and 3 (income) don't check that the goal still needs money; levels 2 and 4 do.
        if (needsPositiveGoal && !(balanceGoals.get(goal)! > 0)) continue;

        const invAmount = new Map([[row.name, balances.get(row.name)!]]);
        const [remInv, remGoal, allocs] = this.allocateInvestmentToGoal(invAmount, balanceGoals.get(goal)!, level, goal, year);
        this.detailed.push(...allocs);
        balanceGoals.set(goal, remGoal);
        if (remInv.size > 0) balances.set(row.name, remInv.values().next().value as number);
        else balances.delete(row.name);
      }
    };
    reservedLevel("Level 1", "goal1", balanceIncome, false);
    reservedLevel("Level 2", "goal1", balanceAsset, true);
    reservedLevel("Level 3", "goal2", balanceIncome, false);
    reservedLevel("Level 4", "goal2", balanceAsset, true);

    // Levels 5–8: goals in priority order (pandas sorts NaN last).
    const sortedGoals = yearGoals
      .map((g, idx) => ({ g, idx }))
      .sort((a, b) => {
        const pa = a.g.priority, pb = b.g.priority;
        const na = pa == null || Number.isNaN(pa), nb = pb == null || Number.isNaN(pb);
        if (na && nb) return a.idx - b.idx;
        if (na) return 1;
        if (nb) return -1;
        return pa! - pb! || a.idx - b.idx;
      })
      .map((x) => x.g.name);

    const poolLevel = (level: string, pool: Map<string, number>, balances: Map<string, number>) => {
      if (pool.size === 0) return;
      const remainingGoals = this.getRemainingGoalsByPriority(balanceGoals, sortedGoals);
      if (remainingGoals.length === 0) return;
      const [remInv, allocs] = this.allocateByPriorityOrder(pool, remainingGoals, level, year);
      this.detailed.push(...allocs);
      // QUIRK: investments used up inside the call are absent from remInv, so their old balance is not removed here.
      for (const [name, amt] of remInv) {
        if (amt > 0) balances.set(name, amt);
        else balances.delete(name);
      }
      for (const a of allocs) balanceGoals.set(a.goal, balanceGoals.get(a.goal)! - a.allocated);
    };
    poolLevel("Level 5", this.getPriorityMapped(balanceIncome, "Income"), balanceIncome);
    poolLevel("Level 6", this.getPriorityMapped(balanceAsset, "Asset"), balanceAsset);
    poolLevel("Level 7", this.getNonPriorityMapped(balanceIncome, "Income"), balanceIncome);
    poolLevel("Level 8", this.getNonPriorityMapped(balanceAsset, "Asset"), balanceAsset);

    for (const [goal, amount] of balanceGoals) {
      if (amount > 0) this.unfulfilled.push({ year, goal, unfulfilledAmount: amount });
    }
  }

  /** Category of an investment: the first matching row across all years. */
  private categoryOf(name: string): AllocationInvestment["category"] | undefined {
    return this.investments.find((i) => i.name === name)?.category;
  }

  /** Investments with Priority Goal 1 or 2 set. QUIRK: only those listed on the priority sheet are considered. */
  getPriorityMapped(available: Map<string, number>, category: AllocationInvestment["category"]): Map<string, number> {
    const out = new Map<string, number>();
    for (const row of this.priorities) {
      if (!available.has(row.name) || this.categoryOf(row.name) !== category) continue;
      if (!isBlankGoal(row.goal1) || !isBlankGoal(row.goal2)) out.set(row.name, available.get(row.name)!);
    }
    return out;
  }

  /** Investments with neither Priority Goal 1 nor 2 ("Fund all other goals"). */
  getNonPriorityMapped(available: Map<string, number>, category: AllocationInvestment["category"]): Map<string, number> {
    const out = new Map<string, number>();
    for (const row of this.priorities) {
      if (!available.has(row.name) || this.categoryOf(row.name) !== category) continue;
      if (isBlankGoal(row.goal1) && isBlankGoal(row.goal2)) out.set(row.name, available.get(row.name)!);
    }
    return out;
  }

  getRemainingGoalsByPriority(balanceGoals: Map<string, number>, sortedGoals: string[]): Array<[string, number]> {
    const out: Array<[string, number]> = [];
    for (const g of sortedGoals) {
      if (balanceGoals.has(g) && balanceGoals.get(g)! > 0) out.push([g, balanceGoals.get(g)!]);
    }
    return out;
  }

  allocateByPriorityOrder(
    investments: Map<string, number>,
    priorityGoals: Array<[string, number]>,
    level: string,
    year: number,
  ): [Map<string, number>, AllocationRecord[]] {
    const allocations: AllocationRecord[] = [];
    let remaining = new Map(investments);
    for (const [goal, amount] of priorityGoals) {
      if (amount > 0 && remaining.size > 0) {
        const [remInv, , goalAllocs] = this.allocateInvestmentToGoal(remaining, amount, level, goal, year);
        allocations.push(...goalAllocs);
        remaining = remInv;
      }
    }
    return [remaining, allocations];
  }

  run(): AllocationResult {
    const years = [...new Set(this.goals.map((g) => g.year))].sort((a, b) => a - b);
    for (const y of years) this.processYearAllocation(y);
    return {
      detailed: this.detailed,
      unfulfilled: this.unfulfilled,
      goalSummary: summarise(this.detailed, (r) => r.goal),
      investmentSummary: summarise(this.detailed, (r) => r.investment),
    };
  }
}

function summarise(rows: AllocationRecord[], key: (r: AllocationRecord) => string): SummaryRow[] {
  const m = new Map<string, SummaryRow>();
  for (const r of rows) {
    const k = `${r.year}\u0000${key(r)}`;
    const cur = m.get(k) ?? { year: r.year, key: key(r), allocated: 0 };
    cur.allocated += r.allocated;
    m.set(k, cur);
  }
  return [...m.values()].sort((a, b) => a.year - b.year || cmpStr(a.key, b.key));
}

/** Convenience: run the allocation in one call. */
export function runAllocation(goals: AllocationGoal[], investments: AllocationInvestment[], priorities: PriorityMapping[]): AllocationResult {
  return new GoalAllocationSystem(goals, investments, priorities).run();
}
