import type { AssumptionSet, FamilyMember, InflationKey, ReturnAssumption, ReturnPeriod } from "@omnimax/shared";
import { INFLATION_KEYS } from "@/data/assumption-defaults";
import { yearAtAge } from "./format";

/**
 * Helpers for reading assumptions. No projections here: only which rate applies
 * and where it comes from (firm default or this client's plan).
 */

export type Source = "firm" | "plan";

export interface EffectiveReturn extends ReturnAssumption { source: Source }
export interface EffectiveInflation { key: InflationKey; ratePct?: number; source: Source }

/** A client's plan overrides whole asset classes and single inflation rates. */
export function effectiveReturns(firm: AssumptionSet, plan?: AssumptionSet): EffectiveReturn[] {
  const classes = [...firm.returns.map((r) => r.assetClass), ...(plan?.returns ?? []).map((r) => r.assetClass)];
  return [...new Set(classes)].map((assetClass) => {
    const own = plan?.returns.find((r) => r.assetClass === assetClass);
    if (own) return { ...own, source: "plan" };
    return { ...firm.returns.find((r) => r.assetClass === assetClass)!, source: "firm" };
  });
}

export function effectiveInflation(firm: AssumptionSet, plan?: AssumptionSet): EffectiveInflation[] {
  return INFLATION_KEYS.map((key) =>
    plan?.inflation[key] != null ? { key, ratePct: plan.inflation[key], source: "plan" } : { key, ratePct: firm.inflation[key], source: "firm" },
  );
}

/** The main client's retirement year (sheet convention: birth year + retirement age). */
export function mainRetirementYear(members: FamilyMember[]): { year?: number; name?: string } {
  const main = members.find((m) => m.isPrimary);
  return { year: yearAtAge(main?.dateOfBirth, main?.retirementAge), name: main?.fullName.split(" ")[0] };
}

/** "12% until 2041, then 8%" */
export function describePeriods(periods: ReturnPeriod[], retirement?: { year?: number; name?: string }): string {
  return periods
    .map((p, i) => {
      const lead = i === 0 ? `${p.ratePct}%` : `then ${p.ratePct}%`;
      if (p.endRule === "year") return `${lead} until ${p.endYear}`;
      if (p.endRule === "retirement") {
        const who = retirement?.name ? `${retirement.name}'s retirement` : "the main client's retirement";
        return `${lead} until ${who}${retirement?.year ? ` (${retirement.year})` : ""}`;
      }
      return periods.length === 1 ? `${p.ratePct}% throughout` : lead;
    })
    .join(", ");
}

/** Problems with a set of periods, or undefined when it is valid. */
export function checkPeriods(periods: ReturnPeriod[]): string | undefined {
  if (!periods.length) return "Add at least one period.";
  for (const p of periods) {
    if (Number.isNaN(p.ratePct) || p.ratePct < 0 || p.ratePct > 100) return "Each rate must be from 0 to 100%.";
    if (p.endRule === "year" && !p.endYear) return "Enter the year each period ends.";
  }
  if (periods.at(-1)!.endRule !== "open") return "The last period must run to the end of the plan.";
  if (periods.slice(0, -1).some((p) => p.endRule === "open")) return "Only the last period can run to the end of the plan.";
  if (periods.filter((p) => p.endRule === "retirement").length > 1) return "Only one period can end at retirement.";
  const years = periods.filter((p) => p.endRule === "year").map((p) => p.endYear!);
  if (years.some((y, i) => i > 0 && y <= years[i - 1])) return "End years must go up from one period to the next.";
  return undefined;
}
