import type { Asset, AssumptionSet, FamilyMember, Goal, Income, PlanResults, Scenario, ScenarioChanges } from "@omnimax/shared";
import { INFLATION_LABEL } from "@/data/assumption-defaults";
import { describePeriods, effectiveReturns } from "./assumptions";
import { formatINRShort, yearAtAge } from "./format";
import { summariseGoals } from "./results";

/**
 * What-if helpers. A scenario holds only differences from the plan; these
 * functions describe them and line up figures for comparison. Nothing here
 * projects money: results come from getResults / getScenarioResults.
 */

/** Members as they would be under the scenario (retirement ages replaced). */
export function membersUnder(members: FamilyMember[], changes: ScenarioChanges): FamilyMember[] {
  const ages = changes.retirementAges ?? {};
  return members.map((m) => (ages[m.id] != null ? { ...m, retirementAge: ages[m.id] } : m));
}

/** One line per change, in plain words, e.g. "Rahul retires at 58 (plan: 55)". */
export function describeChanges(changes: ScenarioChanges, members: FamilyMember[], goals: Goal[]): string[] {
  const out: string[] = [];
  for (const [id, age] of Object.entries(changes.retirementAges ?? {})) {
    const m = members.find((x) => x.id === id);
    if (m) out.push(`${m.fullName.split(" ")[0]} retires at ${age} (plan: ${m.retirementAge ?? "not set"})`);
  }
  for (const r of changes.returns ?? []) out.push(`${r.assetClass}: ${describePeriods(r.periods)}`);
  for (const [k, v] of Object.entries(changes.inflation ?? {})) {
    if (v != null) out.push(`${INFLATION_LABEL[k as keyof typeof INFLATION_LABEL]} inflation ${v}%`);
  }
  for (const [id, c] of Object.entries(changes.goals ?? {})) {
    const g = goals.find((x) => x.id === id);
    if (!g) continue;
    if (c.include === false) {
      out.push(`${g.name} left out`);
      continue;
    }
    if (c.costToday != null) out.push(`${g.name}: ${formatINRShort(c.costToday)} (plan: ${formatINRShort(g.costToday)})`);
    if (c.currentMonthlyExpenses != null) out.push(`${g.name}: ${formatINRShort(c.currentMonthlyExpenses)} a month (plan: ${formatINRShort(g.currentMonthlyExpenses)})`);
    if (c.startYear != null) out.push(`${g.name} in ${c.startYear} (plan: ${g.startYear})`);
    if (c.startAge != null) out.push(`${g.name} at age ${c.startAge} (plan: ${g.startAge})`);
  }
  return out;
}

export interface MovedDate {
  what: string;
  from?: number;
  to?: number;
}

/**
 * Dates that move with a retirement-age change (problems 1 and 12): incomes that
 * end at retirement, contributions that stop at retirement, retirement goals, and
 * return periods that end at the main client's retirement.
 */
export function datesThatMove(
  changes: ScenarioChanges,
  members: FamilyMember[],
  incomes: Income[],
  assets: Asset[],
  goals: Goal[],
  firm: AssumptionSet,
  plan?: AssumptionSet,
): Array<{ member: FamilyMember; from?: number; to?: number; items: MovedDate[] }> {
  const returns = effectiveReturns(firm, plan);
  return Object.entries(changes.retirementAges ?? {}).flatMap(([id, age]) => {
    const m = members.find((x) => x.id === id);
    if (!m) return [];
    const from = yearAtAge(m.dateOfBirth, m.retirementAge);
    const to = yearAtAge(m.dateOfBirth, age);
    const items: MovedDate[] = [
      ...incomes.filter((i) => i.memberId === id && i.endRule === "retirement").map((i) => ({ what: `${i.incomeType} ends`, from, to })),
      ...assets
        .filter((a) => a.ownerMemberId === id && a.contributionEndRule === "retirement")
        .map((a) => ({ what: `${a.name ?? a.subType ?? "Investment"}: contributions stop`, from, to })),
      ...goals.filter((g) => g.goalType === "retirement" && g.memberId === id).map((g) => ({ what: `${g.name} starts`, from, to })),
      ...(m.isPrimary
        ? returns.filter((r) => r.periods.some((p) => p.endRule === "retirement")).map((r) => ({ what: `${r.assetClass} return switches`, from, to }))
        : []),
    ];
    return [{ member: m, from, to, items }];
  });
}

/** Headline figures used to compare the plan with scenarios. */
export interface Headline {
  fullyFunded: number;
  goalCount: number;
  totalShortfall: number;
  firstShortYear?: number;
  retirementFundedPct?: number;
  netWorthAtRetirement?: number;
  netWorthAtEnd: number;
  goalPct: Record<string, number>;
}

export function headline(results: PlanResults, goals: Goal[], retirementYear?: number): Headline {
  const summary = summariseGoals(results, goals);
  const ret = summary.find((s) => s.goal.goalType === "retirement");
  const firstShort = results.goals.filter((g) => g.funded < g.required - 1).map((g) => g.year).sort((a, b) => a - b)[0];
  const nw = (y?: number) => {
    const r = results.netWorth.find((x) => x.year === y);
    return r ? r.assets - r.liabilities : undefined;
  };
  const last = results.netWorth.at(-1)!;
  return {
    fullyFunded: summary.filter((s) => s.shortfall < 1).length,
    goalCount: summary.length,
    totalShortfall: summary.reduce((s, x) => s + x.shortfall, 0),
    firstShortYear: firstShort,
    retirementFundedPct: ret ? (ret.funded / ret.required) * 100 : undefined,
    netWorthAtRetirement: nw(retirementYear),
    netWorthAtEnd: last.assets - last.liabilities,
    goalPct: Object.fromEntries(summary.map((s) => [s.goal.id, s.required ? (s.funded / s.required) * 100 : 0])),
  };
}

/** Shortfall of all goals together, per year (for the comparison chart). */
export function shortfallByYear(results: PlanResults): Map<number, number> {
  const m = new Map<number, number>();
  for (const g of results.goals) m.set(g.year, (m.get(g.year) ?? 0) + Math.max(0, g.required - g.funded));
  return m;
}

export const isEmptyChange = (c: ScenarioChanges) =>
  !Object.keys(c.retirementAges ?? {}).length &&
  !(c.returns ?? []).length &&
  !Object.values(c.inflation ?? {}).some((v) => v != null) &&
  !Object.keys(c.goals ?? {}).length;

export type { Scenario };
