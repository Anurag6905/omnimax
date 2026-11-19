import type { Asset, AllocationRow, Goal, Income, PlanResults } from "@omnimax/shared";
import sharmaResults from "@/data/sample-results.json";

/**
 * Plan results for the screens. Phase 1A: one fixed set of ILLUSTRATIVE figures
 * for the Sharma family (data/sample-results.json); every other client has none.
 * Phase 1B replaces getResults with the calculation engine. Nothing here calculates.
 */
export function getResults(clientId: string): PlanResults | undefined {
  return clientId === "c-1" ? (sharmaResults as PlanResults) : undefined;
}

export interface GoalSummary {
  goal: Goal;
  firstYear: number;
  lastYear: number;
  required: number;
  funded: number;
  shortfall: number;
  /** first year with a shortfall, if any */
  shortFrom?: number;
}

/** Totals per goal across all its years, in priority order. */
export function summariseGoals(results: PlanResults, goals: Goal[]): GoalSummary[] {
  return [...goals]
    .sort((a, b) => (a.priorityRank ?? 999) - (b.priorityRank ?? 999))
    .flatMap((goal) => {
      const rows = results.goals.filter((g) => g.goalId === goal.id);
      if (!rows.length) return [];
      const required = rows.reduce((s, r) => s + r.required, 0);
      const funded = rows.reduce((s, r) => s + r.funded, 0);
      const short = rows.find((r) => r.funded < r.required - 1);
      return [{ goal, firstYear: rows[0].year, lastYear: rows.at(-1)!.year, required, funded, shortfall: Math.max(0, required - funded), shortFrom: short?.year }];
    });
}

/** Readable name for an allocation source. */
export function sourceName(sourceId: string, assets: Asset[], incomes: Income[]): string {
  if (sourceId === "surplus") return "Saved surplus";
  const a = assets.find((x) => x.id === sourceId);
  if (a) return a.name ?? ([a.subType, a.institution].filter(Boolean).join(", ") || "Asset");
  const i = incomes.find((x) => x.id === sourceId);
  return i ? i.incomeType : sourceId;
}

export const BASIS_LABEL: Record<AllocationRow["basis"], string> = {
  surplus: "Saved surplus, used first",
  "reserved-1": "Reserved: priority goal 1",
  "reserved-2": "Reserved: priority goal 2",
  "reserved-3": "Reserved: priority goal 3",
  any: "Any goal, split equally",
};

/**
 * Asset class used to group holdings for allocation charts.
 * Follows the proposed mapping on the Firm assumptions page.
 */
export function assetClassOf(asset: Asset | undefined, sourceId: string): string {
  if (sourceId === "surplus") return "Saved surplus";
  if (!asset) return "Other";
  switch (asset.category) {
    case "mutual_fund": return asset.assetClass ?? "Other";
    case "equity": return "Equity";
    case "real_estate": return "Real estate";
    case "cash_bank": return "Cash";
    case "gold_silver": return "Gold";
    case "fixed_income": case "small_savings": case "retirement": return "Debt";
    default: return "Other";
  }
}

/** Holdings grouped by asset class at the end of a year, largest first. */
export function allocationByClass(results: PlanResults, assets: Asset[], year: number): Array<{ assetClass: string; value: number }> {
  const totals = new Map<string, number>();
  for (const r of results.investments) {
    if (r.year !== year || r.endValue <= 0) continue;
    const cls = assetClassOf(assets.find((a) => a.id === r.sourceId), r.sourceId);
    totals.set(cls, (totals.get(cls) ?? 0) + r.endValue);
  }
  return [...totals.entries()].map(([assetClass, value]) => ({ assetClass, value })).sort((a, b) => b.value - a.value);
}
