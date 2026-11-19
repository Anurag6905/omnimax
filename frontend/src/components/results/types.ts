import type { Asset, FamilyMember, Goal, Income, PlanResults } from "@omnimax/shared";

/** What every results view receives from the results page. */
export interface ResultsViewProps {
  results: PlanResults;
  goals: Goal[];
  assets: Asset[];
  incomes: Income[];
  /** main client first */
  members: FamilyMember[];
  /** retirement year of each member with a retirement age */
  retirements: Array<{ name: string; year: number }>;
}
