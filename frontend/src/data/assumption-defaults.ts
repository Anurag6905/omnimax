import type { AssetCategory, AssumptionSet, InflationKey } from "@omnimax/shared";

/**
 * SAMPLE firm-wide assumptions for Phase 1A screens.
 * These numbers are placeholders for review, not the firm's real rates.
 * Equity "12% until 2041, then 8%" is the example from the project plan.
 */
export const SAMPLE_FIRM_ASSUMPTIONS: AssumptionSet = {
  returns: [
    { assetClass: "Equity", periods: [{ ratePct: 12, endRule: "year", endYear: 2041 }, { ratePct: 8, endRule: "open" }] },
    { assetClass: "International equity", periods: [{ ratePct: 10, endRule: "open" }] },
    { assetClass: "Hybrid", periods: [{ ratePct: 9, endRule: "open" }] },
    { assetClass: "Debt", periods: [{ ratePct: 7, endRule: "open" }] },
    { assetClass: "Gold", periods: [{ ratePct: 8, endRule: "open" }] },
    { assetClass: "Real estate", periods: [{ ratePct: 6, endRule: "open" }] },
    { assetClass: "Cash", periods: [{ ratePct: 3.5, endRule: "open" }] },
  ],
  inflation: { expenses: 6, retirement: 6, education: 10, marriage: 7, vacation: 6, house: 6, car: 5, other: 6 },
  updatedAt: "2026-11-19T09:00:00Z",
  updatedBy: "u-sameer",
};

export const INFLATION_LABEL: Record<InflationKey, string> = {
  expenses: "Household expenses",
  retirement: "Retirement goals",
  education: "Education goals",
  marriage: "Marriage goals",
  vacation: "Vacation goals",
  house: "House goals",
  car: "Car goals",
  other: "Other goals",
};

export const INFLATION_KEYS = Object.keys(INFLATION_LABEL) as InflationKey[];

/**
 * PROPOSAL: which asset class's return each asset section uses.
 * Mutual funds use the asset class entered on each fund; miscellaneous assets
 * use the expected growth rate entered on the asset. Confirm with advisers.
 */
export const CATEGORY_ASSET_CLASS: Record<AssetCategory, string> = {
  real_estate: "Real estate",
  cash_bank: "Cash",
  fixed_income: "Debt",
  small_savings: "Debt",
  retirement: "Debt",
  gold_silver: "Gold",
  miscellaneous: "Its own expected growth rate",
  mutual_fund: "The asset class entered on each fund",
  equity: "Equity",
};
