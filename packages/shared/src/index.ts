/**
 * Client-data types shared across web, api and engine.
 * Keep in step with db/schema.sql (one interface per table).
 * Money is a number in INR here; the database stores numeric(18,2).
 * Rates are percents (7.5 = 7.5%).
 */

export type UUID = string;
export type ISODate = string; // "2026-11-19"

// ---- dropdown lists from the Client Data Gathering Sheet ----
export const ROLES = ['adviser', 'operations', 'admin'] as const;
export const RESIDENCE_STATUS = ['Resident Indian', 'NRI'] as const;
export const INCOME_TYPES = ['Salary (take home)', 'Bonus', 'Business (net profit)', 'Rental Income'] as const;
export const INCOME_FREQUENCIES = ['Monthly', 'Half-Yearly', 'Annually'] as const;
export const PRIORITY_LEVELS = ['High', 'Medium', 'Low'] as const;
export const GOAL_TYPES = ['retirement', 'education', 'marriage', 'vacation', 'house', 'car', 'other'] as const;
export const ASSET_CATEGORIES = [
  'real_estate', 'cash_bank', 'fixed_income', 'small_savings', 'retirement',
  'gold_silver', 'miscellaneous', 'mutual_fund', 'equity',
] as const;
export const PROPERTY_TYPES = ['Residential House/Flat', 'Investment Property', 'Plot', 'Agricultural Land', 'Commercial'] as const;
export const GOLD_TYPES = ['Bar / Coin', 'Mutual Fund', 'ETF', 'SGB Bond'] as const;
export const LOAN_TYPES = ['Home Loan', 'Education Loan', 'Personal Loan', 'Loan against Policy / MF / Shares', 'Vehicle Loan'] as const;
export const POLICY_STATUS = ['Active', 'Lapsed'] as const;
export const GENERAL_COVER_TYPES = ['HP', 'PA', 'CI'] as const;
export const GENERAL_POLICY_TYPES = ['Individual', 'Floater', 'Group'] as const;

export type Role = (typeof ROLES)[number];
export type ResidenceStatus = (typeof RESIDENCE_STATUS)[number];
export type IncomeType = (typeof INCOME_TYPES)[number];
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type GoalType = (typeof GOAL_TYPES)[number];
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];
export type LoanType = (typeof LOAN_TYPES)[number];

// ---- tables ----
export interface User { id: UUID; fullName: string; email: string; role: Role; isActive: boolean }

export interface Client {
  id: UUID; clientCode: string; householdName: string; adviserId?: UUID;
  status: 'prospect' | 'active' | 'inactive'; dataSheetDate?: ISODate; remarks?: string;
}

export interface FamilyMember {
  id: UUID; clientId: UUID; isPrimary: boolean; fullName: string; relationship: string;
  occupation?: string; dateOfBirth?: ISODate; retirementAge?: number; lifeExpectancy: number;
  financiallyDependent?: boolean; healthStatus?: string; tobaccoUser?: boolean;
  healthHistory?: string; healthRemark?: string; panNumber?: string; mobile?: string;
  email?: string; residenceStatus?: ResidenceStatus; companyDesignation?: string; sortOrder: number;
}

export interface Income {
  id: UUID; clientId: UUID; memberId: UUID; incomeType: IncomeType;
  frequency: IncomeFrequency; amount: number; annualGrowthPct?: number; remark?: string;
}

export interface ExpenseCategory { id: number; groupName: 'Household' | 'Lifestyle' | 'Misc'; name: string; sortOrder: number }
export interface Expense { id: UUID; clientId: UUID; categoryId: number; monthlyAmount: number; remark?: string }

export interface Goal {
  id: UUID; clientId: UUID; memberId?: UUID; goalType: GoalType; name: string;
  priorityLevel?: PriorityLevel; priorityRank?: number; costToday?: number;
  startAge?: number; startYear?: number; endYear?: number; tenureYears?: number; frequencyYears?: number;
  currentMonthlyExpenses?: number; loanAmount?: number; isWanted?: boolean; timeFrame?: string;
  inflationPct?: number; remark?: string;
}

export interface Asset {
  id: UUID; clientId: UUID; ownerMemberId?: UUID; category: AssetCategory; subType?: string;
  name?: string; institution?: string; location?: string; assetClass?: string;
  investedAmount?: number; currentValue?: number; valueAsOf?: ISODate; startDate?: ISODate;
  maturityDate?: ISODate; maturityValue?: number; interestRatePct?: number; compounding?: string;
  expectedGrowthPct?: number; monthlyContribution?: number; employerMonthlyContribution?: number;
  yearlyContribution?: number; annualStepUpPct?: number; quantity?: number; buyPrice?: number; remark?: string;
}

/** "Priority Goal 1/2/3" for an investment or income stream (Input_Allocations.py). */
export interface GoalFundingLink {
  id: UUID; clientId: UUID; goalId: UUID; assetId?: UUID; incomeId?: UUID; rank: 1 | 2 | 3;
}

export interface Liability {
  id: UUID; clientId: UUID; ownerMemberId?: UUID; loanType: LoanType; principalOutstanding: number;
  emiAmount?: number; emiEndMonth?: ISODate; interestRatePct?: number; lender?: string; remark?: string;
}

export interface CreditCardProfile {
  clientId: UUID; cardCount?: number; outstandingAmount?: number;
  paymentBehaviour?: 'Full' | 'Partial'; yearlyUsage?: number; yearsUsing?: number;
}

export interface LifeInsurancePolicy {
  id: UUID; clientId: UUID; insuredMemberId?: UUID; policyName: string; policyNumber?: string;
  commencementDate?: ISODate; sumAssured?: number; premiumAmount?: number; premiumFrequency?: string;
  policyTermYears?: number; pptYears?: number; surrenderValue?: number; maturityValue?: number;
  riders?: string; nomineeName?: string; status?: (typeof POLICY_STATUS)[number];
}

export interface GeneralInsurancePolicy {
  id: UUID; clientId: UUID; insuredMemberId?: UUID; policyName: string;
  coverType?: (typeof GENERAL_COVER_TYPES)[number]; policyType?: (typeof GENERAL_POLICY_TYPES)[number];
  commencementDate?: ISODate; sumAssured?: number; annualPremium?: number; tenureYears?: number; renewalDate?: ISODate;
}
