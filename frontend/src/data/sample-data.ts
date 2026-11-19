import type { Client, FamilyMember, User } from "@omnimax/shared";
import type { RecordMap } from "@/lib/store";

/** Sample data for Phase 1A screens. Fictional people only — never real clients. */

export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: User[] = [
  { id: "u-priya", fullName: "Priya Nair", email: "priya@omnimax.demo", role: "adviser", isActive: true },
  { id: "u-arjun", fullName: "Arjun Mehta", email: "arjun@omnimax.demo", role: "adviser", isActive: true },
  { id: "u-kavita", fullName: "Kavita Rao", email: "kavita@omnimax.demo", role: "operations", isActive: true },
  { id: "u-sameer", fullName: "Sameer Khan", email: "sameer@omnimax.demo", role: "admin", isActive: true },
];

export type ClientRecord = Client & { createdAt: string; updatedAt: string };

export const SAMPLE_CLIENTS: ClientRecord[] = [
  { id: "c-1", clientCode: "CL-0001", householdName: "Sharma family", adviserId: "u-priya", status: "active", dataSheetDate: "2025-10-01", remarks: "Wants to retire early if the house loan is closed by 2032.", createdAt: "2025-10-02T10:00:00Z", updatedAt: "2026-11-18T09:20:00Z" },
  { id: "c-2", clientCode: "CL-0002", householdName: "Iyer family", adviserId: "u-priya", status: "active", dataSheetDate: "2025-08-14", createdAt: "2025-08-15T10:00:00Z", updatedAt: "2026-11-12T14:00:00Z" },
  { id: "c-3", clientCode: "CL-0003", householdName: "D'Souza family", adviserId: "u-arjun", status: "active", dataSheetDate: "2025-06-03", remarks: "NRI in Dubai, plans to return to Goa at retirement.", createdAt: "2025-06-04T10:00:00Z", updatedAt: "2026-11-05T11:00:00Z" },
  { id: "c-4", clientCode: "CL-0004", householdName: "Banerjee family", adviserId: "u-arjun", status: "prospect", createdAt: "2026-11-10T10:00:00Z", updatedAt: "2026-11-17T16:45:00Z" },
  { id: "c-5", clientCode: "CL-0005", householdName: "Reddy family", adviserId: "u-priya", status: "active", dataSheetDate: "2024-12-20", createdAt: "2024-12-21T10:00:00Z", updatedAt: "2026-10-28T08:30:00Z" },
  { id: "c-6", clientCode: "CL-0006", householdName: "Kapoor family", adviserId: "u-arjun", status: "inactive", dataSheetDate: "2023-03-11", remarks: "Paused planning in 2025.", createdAt: "2023-03-12T10:00:00Z", updatedAt: "2025-04-02T10:00:00Z" },
  { id: "c-7", clientCode: "CL-0007", householdName: "Gill family", adviserId: "u-priya", status: "prospect", createdAt: "2026-11-15T10:00:00Z", updatedAt: "2026-11-19T07:10:00Z" },
  { id: "c-8", clientCode: "CL-0008", householdName: "Joshi family", adviserId: "u-arjun", status: "active", dataSheetDate: "2025-09-09", createdAt: "2025-09-10T10:00:00Z", updatedAt: "2026-11-01T12:00:00Z" },
];

type M = Omit<FamilyMember, "id" | "sortOrder" | "lifeExpectancy"> & { lifeExpectancy?: number };
const rows: Array<[string, M]> = [
  ["c-1", { clientId: "c-1", isPrimary: true, fullName: "Rahul Sharma", relationship: "Self", occupation: "Salaried", dateOfBirth: "1985-04-12", retirementAge: 55, financiallyDependent: false, healthStatus: "Good", tobaccoUser: false, panNumber: "ABCPS1234K", mobile: "98201 45567", email: "rahul.sharma@example.com", residenceStatus: "Resident Indian", companyDesignation: "Tata Consultancy Services, Delivery Manager" }],
  ["c-1", { clientId: "c-1", isPrimary: false, fullName: "Neha Sharma", relationship: "Spouse", occupation: "Salaried", dateOfBirth: "1988-09-30", retirementAge: 55, financiallyDependent: false, healthStatus: "Good", tobaccoUser: false, panNumber: "BCDPS5678L", mobile: "98201 45568", residenceStatus: "Resident Indian", companyDesignation: "HDFC Bank, Relationship Manager" }],
  ["c-1", { clientId: "c-1", isPrimary: false, fullName: "Aarav Sharma", relationship: "Son", occupation: "Student", dateOfBirth: "2014-02-18", financiallyDependent: true, healthStatus: "Good", residenceStatus: "Resident Indian" }],
  ["c-1", { clientId: "c-1", isPrimary: false, fullName: "Kamla Sharma", relationship: "Mother", occupation: "Retired", dateOfBirth: "1958-07-05", financiallyDependent: true, healthStatus: "Diabetic, controlled", lifeExpectancy: 85, residenceStatus: "Resident Indian" }],
  ["c-2", { clientId: "c-2", isPrimary: true, fullName: "Venkat Iyer", relationship: "Self", occupation: "Business", dateOfBirth: "1976-11-02", retirementAge: 62, financiallyDependent: false, healthStatus: "Good", panNumber: "AAKPI4433M", mobile: "98450 11223", email: "venkat@iyertextiles.example", residenceStatus: "Resident Indian", companyDesignation: "Iyer Textiles, Proprietor" }],
  ["c-2", { clientId: "c-2", isPrimary: false, fullName: "Lakshmi Iyer", relationship: "Spouse", occupation: "Homemaker", dateOfBirth: "1979-03-21", financiallyDependent: true, healthStatus: "Good", residenceStatus: "Resident Indian" }],
  ["c-2", { clientId: "c-2", isPrimary: false, fullName: "Meera Iyer", relationship: "Daughter", occupation: "Student", dateOfBirth: "2006-06-14", financiallyDependent: true, residenceStatus: "Resident Indian" }],
  ["c-3", { clientId: "c-3", isPrimary: true, fullName: "Joel D'Souza", relationship: "Self", occupation: "Salaried", dateOfBirth: "1981-01-27", retirementAge: 58, financiallyDependent: false, healthStatus: "Good", panNumber: "CFGPD7788Q", mobile: "+971 50 412 7788", email: "joel.dsouza@example.com", residenceStatus: "NRI", companyDesignation: "Emirates Group, Senior Engineer" }],
  ["c-3", { clientId: "c-3", isPrimary: false, fullName: "Maria D'Souza", relationship: "Spouse", occupation: "Salaried", dateOfBirth: "1983-08-08", retirementAge: 58, financiallyDependent: false, residenceStatus: "NRI" }],
  ["c-4", { clientId: "c-4", isPrimary: true, fullName: "Ananya Banerjee", relationship: "Self", occupation: "Salaried", dateOfBirth: "1992-12-01", retirementAge: 60, financiallyDependent: false, mobile: "98300 55667", email: "ananya.b@example.com", residenceStatus: "Resident Indian" }],
  ["c-5", { clientId: "c-5", isPrimary: true, fullName: "Srinivas Reddy", relationship: "Self", occupation: "Retired", dateOfBirth: "1962-05-19", retirementAge: 60, financiallyDependent: false, healthStatus: "Hypertension", tobaccoUser: false, panNumber: "AEEPR2211F", mobile: "98490 33445", residenceStatus: "Resident Indian" }],
  ["c-5", { clientId: "c-5", isPrimary: false, fullName: "Padma Reddy", relationship: "Spouse", occupation: "Retired", dateOfBirth: "1965-10-10", retirementAge: 58, financiallyDependent: false, residenceStatus: "Resident Indian" }],
  ["c-6", { clientId: "c-6", isPrimary: true, fullName: "Rohan Kapoor", relationship: "Self", occupation: "Business", dateOfBirth: "1979-02-14", retirementAge: 60, financiallyDependent: false, mobile: "98110 99887", residenceStatus: "Resident Indian" }],
  ["c-7", { clientId: "c-7", isPrimary: true, fullName: "Harpreet Gill", relationship: "Self", occupation: "Professional", dateOfBirth: "1987-07-23", retirementAge: 60, financiallyDependent: false, mobile: "98140 12121", email: "dr.gill@example.com", residenceStatus: "Resident Indian", companyDesignation: "Gill Dental Clinic, Owner" }],
  ["c-7", { clientId: "c-7", isPrimary: false, fullName: "Simran Gill", relationship: "Spouse", occupation: "Professional", dateOfBirth: "1989-04-04", retirementAge: 60, financiallyDependent: false, residenceStatus: "Resident Indian" }],
  ["c-7", { clientId: "c-7", isPrimary: false, fullName: "Jasleen Gill", relationship: "Daughter", occupation: "Student", dateOfBirth: "2019-11-30", financiallyDependent: true, residenceStatus: "Resident Indian" }],
  ["c-8", { clientId: "c-8", isPrimary: true, fullName: "Nikhil Joshi", relationship: "Self", occupation: "Salaried", dateOfBirth: "1990-03-15", retirementAge: 58, financiallyDependent: false, panNumber: "BHJPJ9090A", mobile: "98220 76543", residenceStatus: "Resident Indian", companyDesignation: "Infosys, Product Lead" }],
  ["c-8", { clientId: "c-8", isPrimary: false, fullName: "Pooja Joshi", relationship: "Spouse", occupation: "Salaried", dateOfBirth: "1991-12-12", retirementAge: 58, financiallyDependent: false, residenceStatus: "Resident Indian" }],
];

export const SAMPLE_MEMBERS: FamilyMember[] = rows.map(([, m], i) => ({
  ...m,
  id: `m-${i + 1}`,
  sortOrder: i,
  lifeExpectancy: m.lifeExpectancy ?? 85, // sheet default
}));

/**
 * Sample records for the Sharma family (c-1), covering every section of the
 * data sheet. Other households start empty so the empty states can be reviewed.
 * Member ids: m-1 Rahul, m-2 Neha, m-3 Aarav, m-4 Kamla.
 */
const C = "c-1";
export const SAMPLE_RECORDS: RecordMap = {
  incomes: [
    { id: "in-1", clientId: C, memberId: "m-1", incomeType: "Salary (take home)", frequency: "Monthly", amount: 210000, annualGrowthPct: 7, endRule: "retirement" },
    { id: "in-2", clientId: C, memberId: "m-1", incomeType: "Bonus", frequency: "Annually", amount: 400000, annualGrowthPct: 5, endRule: "retirement" },
    { id: "in-3", clientId: C, memberId: "m-2", incomeType: "Salary (take home)", frequency: "Monthly", amount: 140000, annualGrowthPct: 7, endRule: "retirement" },
    { id: "in-4", clientId: C, memberId: "m-2", incomeType: "Rental Income", frequency: "Monthly", amount: 25000, annualGrowthPct: 5, endRule: "lifetime", remark: "Flat in Wakad, let out" },
  ],
  expenses: [
    [1, 18000], [2, 2500], [3, 6000], [4, 8000], [5, 5000], [6, 1500], [7, 9000], [8, 2000], [9, 800],
    [10, 4000], [11, 6000], [12, 5000], [13, 8000], [14, 3000], [15, 15000], [16, 18000], [17, 10000], [18, 2000],
  ].map(([categoryId, monthlyAmount]) => ({ id: `ex-${categoryId}`, clientId: C, categoryId, monthlyAmount })),
  goals: [
    { id: "g-1", clientId: C, memberId: "m-1", goalType: "retirement", name: "Rahul – retirement", priorityLevel: "High", priorityRank: 1, currentMonthlyExpenses: 120000 },
    { id: "g-2", clientId: C, memberId: "m-3", goalType: "education", name: "Aarav – engineering", priorityLevel: "High", priorityRank: 2, startAge: 18, tenureYears: 4, costToday: 600000, inflationPct: 11 },
    { id: "g-3", clientId: C, goalType: "house", name: "Dream House", priorityLevel: "High", priorityRank: 3, startYear: 2032, costToday: 15000000, loanAmount: 9000000 },
    { id: "g-4", clientId: C, goalType: "car", name: "Decent Car", priorityLevel: "Medium", priorityRank: 4, startYear: 2028, costToday: 1500000, loanAmount: 0 },
    { id: "g-5", clientId: C, memberId: "m-3", goalType: "marriage", name: "Aarav – marriage", priorityLevel: "Medium", priorityRank: 5, startAge: 28, costToday: 2500000 },
    { id: "g-6", clientId: C, goalType: "vacation", name: "Family vacations", priorityLevel: "Low", priorityRank: 6, startYear: 2027, endYear: 2045, frequencyYears: 2, costToday: 300000 },
    { id: "g-7", clientId: C, goalType: "other", name: "Mother's knee surgery fund", priorityLevel: "Medium", priorityRank: 7, isWanted: true, timeFrame: "Within 3 years", costToday: 400000 },
  ],
  assets: [
    { id: "a-1", clientId: C, ownerMemberId: "m-1", category: "real_estate", subType: "Residential House/Flat", location: "Pune, Maharashtra", startDate: "2016-01-01", investedAmount: 7500000, currentValue: 13500000 },
    { id: "a-2", clientId: C, ownerMemberId: "m-2", category: "real_estate", subType: "Investment Property", location: "Pune, Maharashtra", startDate: "2020-01-01", investedAmount: 4200000, currentValue: 5600000 },
    { id: "a-3", clientId: C, ownerMemberId: "m-1", category: "cash_bank", subType: "Savings account", institution: "HDFC Bank", currentValue: 450000 },
    { id: "a-4", clientId: C, ownerMemberId: "m-2", category: "cash_bank", subType: "Savings account", institution: "ICICI Bank", currentValue: 180000 },
    { id: "a-5", clientId: C, ownerMemberId: "m-1", category: "fixed_income", subType: "FD", institution: "State Bank of India", investedAmount: 1000000, maturityValue: 1236000, startDate: "2024-03-15", maturityDate: "2027-03-15", interestRatePct: 7.1, compounding: "Quarterly" },
    { id: "a-6", clientId: C, ownerMemberId: "m-1", category: "small_savings", subType: "PPF", investedAmount: 950000, startDate: "2015-04-01", maturityDate: "2031-04-01", maturityValue: 2400000, monthlyContribution: 12500, contributionEndRule: "year", contributionEndYear: 2031, availableFromYear: 2031 },
    { id: "a-7", clientId: C, ownerMemberId: "m-2", category: "small_savings", subType: "NPS", investedAmount: 520000, startDate: "2019-07-01", monthlyContribution: 5000, contributionEndRule: "retirement", availableFromYear: 2048 },
    { id: "a-8", clientId: C, ownerMemberId: "m-1", category: "retirement", subType: "EPF", currentValue: 1840000, valueAsOf: "2026-10-31", monthlyContribution: 21600, employerMonthlyContribution: 21600, contributionEndRule: "retirement", availableFromYear: 2040 },
    { id: "a-9", clientId: C, ownerMemberId: "m-2", category: "gold_silver", subType: "SGB Bond", investedAmount: 300000, currentValue: 520000, yearlyContribution: 50000, contributionEndRule: "year", contributionEndYear: 2030 },
    { id: "a-10", clientId: C, ownerMemberId: "m-1", category: "miscellaneous", subType: "Unlisted shares (ESOP)", investedAmount: 200000, currentValue: 650000, expectedGrowthPct: 10 },
    { id: "a-11", clientId: C, ownerMemberId: "m-1", category: "mutual_fund", name: "Parag Parikh Flexi Cap Fund", assetClass: "Equity", currentValue: 1240000, monthlyContribution: 25000, annualStepUpPct: 10, contributionEndRule: "retirement" },
    { id: "a-12", clientId: C, ownerMemberId: "m-2", category: "mutual_fund", name: "HDFC Mid-Cap Opportunities Fund", assetClass: "Equity", currentValue: 680000, monthlyContribution: 15000, contributionEndRule: "retirement" },
    { id: "a-13", clientId: C, ownerMemberId: "m-1", category: "mutual_fund", name: "ICICI Prudential Corporate Bond Fund", assetClass: "Debt", currentValue: 410000 },
    { id: "a-14", clientId: C, ownerMemberId: "m-1", category: "equity", name: "HDFCBANK", quantity: 200, buyPrice: 1450, currentValue: 340000 },
    { id: "a-15", clientId: C, ownerMemberId: "m-1", category: "equity", name: "INFY", quantity: 150, buyPrice: 1380, currentValue: 270000 },
  ],
  goalLinks: [
    { id: "gl-1", clientId: C, goalId: "g-1", assetId: "a-11", rank: 1 },
    { id: "gl-2", clientId: C, goalId: "g-2", assetId: "a-13", rank: 1 },
    { id: "gl-3", clientId: C, goalId: "g-2", assetId: "a-6", rank: 1 },
    { id: "gl-4", clientId: C, goalId: "g-1", assetId: "a-6", rank: 2 },
    { id: "gl-5", clientId: C, goalId: "g-4", assetId: "a-5", rank: 1 },
    { id: "gl-6", clientId: C, goalId: "g-1", assetId: "a-8", rank: 1 },
  ],
  liabilities: [
    { id: "l-1", clientId: C, ownerMemberId: "m-1", loanType: "Home Loan", principalOutstanding: 3800000, emiAmount: 42000, emiEndMonth: "2032-03-01", interestRatePct: 8.6, lender: "HDFC Bank" },
    { id: "l-2", clientId: C, ownerMemberId: "m-2", loanType: "Vehicle Loan", principalOutstanding: 320000, emiAmount: 15500, emiEndMonth: "2028-08-01", interestRatePct: 9.2, lender: "ICICI Bank" },
  ],
  creditCards: [{ clientId: C, cardCount: 3, outstandingAmount: 45000, paymentBehaviour: "Full", yearlyUsage: 600000, yearsUsing: 9 }],
  lifePolicies: [
    { id: "lp-1", clientId: C, insuredMemberId: "m-1", policyName: "HDFC Life Click 2 Protect", policyNumber: "HL-2381190", commencementDate: "2018-06-10", sumAssured: 20000000, premiumAmount: 24500, premiumFrequency: "Yearly", policyTermYears: 30, pptYears: 30, nomineeName: "Neha Sharma", status: "Active" },
    { id: "lp-2", clientId: C, insuredMemberId: "m-1", policyName: "LIC Jeevan Anand", policyNumber: "LIC-77120034", commencementDate: "2012-02-01", sumAssured: 1000000, premiumAmount: 48000, premiumFrequency: "Yearly", policyTermYears: 21, pptYears: 21, surrenderValue: 380000, maturityValue: 2200000, riders: "Accidental death benefit", nomineeName: "Kamla Sharma", status: "Active" },
    { id: "lp-3", clientId: C, insuredMemberId: "m-2", policyName: "Max Life Smart Term", policyNumber: "ML-5521876", commencementDate: "2020-09-01", sumAssured: 10000000, premiumAmount: 14800, premiumFrequency: "Yearly", policyTermYears: 35, pptYears: 35, nomineeName: "Rahul Sharma", status: "Active" },
  ],
  generalPolicies: [
    { id: "gp-1", clientId: C, insuredMemberId: "m-1", policyName: "Star Health Family Optima", coverType: "HP", policyType: "Floater", commencementDate: "2019-02-14", sumAssured: 1000000, annualPremium: 32000, tenureYears: 1, renewalDate: "2027-02-14" },
    { id: "gp-2", clientId: C, insuredMemberId: "m-4", policyName: "Care Senior", coverType: "HP", policyType: "Individual", commencementDate: "2021-05-01", sumAssured: 500000, annualPremium: 41000, tenureYears: 1, renewalDate: "2027-05-01" },
    { id: "gp-3", clientId: C, insuredMemberId: "m-1", policyName: "TATA AIG Accident Guard", coverType: "PA", policyType: "Individual", commencementDate: "2022-01-10", sumAssured: 5000000, annualPremium: 4200, tenureYears: 1, renewalDate: "2027-01-10" },
  ],
};
