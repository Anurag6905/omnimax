import type { AssetCategory, ExpenseCategory, GoalType } from "@omnimax/shared";

/**
 * Fixed lists taken from "2025-10-01_Client Data Gathering Sheet.xlsx".
 * Where the sheet has a dropdown, the values are copied exactly.
 * Where it has free text, these are suggestions only (marked below).
 */

/** Personal Details › Outflow – Expenses: the 18 lines, same order as db/schema.sql seed. */
export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 1, groupName: "Household", name: "Food, Grocery, Gas Etc.", sortOrder: 1 },
  { id: 2, groupName: "Household", name: "Mobile / Telephone / Internet", sortOrder: 2 },
  { id: 3, groupName: "Household", name: "Electricity / Water / Labour / AMCs / Security", sortOrder: 3 },
  { id: 4, groupName: "Household", name: "House Help / Maid", sortOrder: 4 },
  { id: 5, groupName: "Household", name: "House Rent / Maintenance / Repair", sortOrder: 5 },
  { id: 6, groupName: "Household", name: "Household Appliances", sortOrder: 6 },
  { id: 7, groupName: "Household", name: "Conveyance, Fuel & Maintenance", sortOrder: 7 },
  { id: 8, groupName: "Household", name: "Vehicle Insurance & Maintenance", sortOrder: 8 },
  { id: 9, groupName: "Household", name: "Property Tax", sortOrder: 9 },
  { id: 10, groupName: "Household", name: "Medicines / Doctor / Healthcare / Preventive Checkup", sortOrder: 10 },
  { id: 11, groupName: "Lifestyle", name: "Clothes & Accessories", sortOrder: 11 },
  { id: 12, groupName: "Lifestyle", name: "Shopping, Gifts, Whitegoods, Gadgets", sortOrder: 12 },
  { id: 13, groupName: "Lifestyle", name: "Dining / Movies / Sports", sortOrder: 13 },
  { id: 14, groupName: "Lifestyle", name: "Personal Care / Others", sortOrder: 14 },
  { id: 15, groupName: "Misc", name: "Travel & Annual Vacations", sortOrder: 15 },
  { id: 16, groupName: "Misc", name: "Children's Schooling/College Expenses", sortOrder: 16 },
  { id: 17, groupName: "Misc", name: "Contribution to Parents, Siblings etc", sortOrder: 17 },
  { id: 18, groupName: "Misc", name: "Donation / Charity", sortOrder: 18 },
];

export const EXPENSE_GROUP_LABEL = { Household: "Household expenses", Lifestyle: "Lifestyle expenses", Misc: "Misc expenses" } as const;

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  retirement: "Retirement",
  education: "Education",
  marriage: "Marriage",
  vacation: "Vacation",
  house: "House",
  car: "Car",
  other: "Other",
};

/** Assets tab: the nine sections, in sheet order, with the sheet's own headings. */
export const ASSET_SECTIONS: Array<{ category: AssetCategory; title: string; noun: string }> = [
  { category: "real_estate", title: "Real estate", noun: "property" },
  { category: "cash_bank", title: "Cash and savings bank accounts", noun: "account" },
  { category: "fixed_income", title: "FD, bonds, debentures, POMIS, KVP, SCSS, NSC", noun: "deposit or bond" },
  { category: "small_savings", title: "PPF, RD, NPS", noun: "account" },
  { category: "retirement", title: "Retirement accounts: EPF, superannuation, gratuity", noun: "account" },
  { category: "gold_silver", title: "Gold and silver (not jewellery for own use)", noun: "holding" },
  { category: "miscellaneous", title: "Miscellaneous assets", noun: "asset" },
  { category: "mutual_fund", title: "Mutual funds and SIPs", noun: "fund" },
  { category: "equity", title: "Equity stocks and PMS", noun: "holding" },
];

// Dropdowns copied from the sheet
export const PROPERTY_TYPES = ["Residential House/Flat", "Investment Property", "Plot", "Agricultural Land", "Commercial"];
export const GOLD_TYPES = ["Bar / Coin", "Mutual Fund", "ETF", "SGB Bond"];
export const LOAN_TYPES = ["Home Loan", "Education Loan", "Personal Loan", "Loan against Policy / MF / Shares", "Vehicle Loan"];
export const HOUSE_CAR_GOALS = ["Dream House", "Decent Car"];

// From the sheet's section headings (free text in the sheet, offered as a list here)
export const FIXED_INCOME_TYPES = ["FD", "NBFC FD", "Bonds", "Debentures", "POMIS", "KVP", "SCSS", "NSC"];
export const SMALL_SAVINGS_TYPES = ["PPF", "RD", "NPS"];
export const RETIREMENT_ACCOUNT_TYPES = ["EPF", "Superannuation", "Gratuity"];

// Suggestions only: the sheet leaves these as free text
export const CASH_TYPE_SUGGESTIONS = ["Savings account", "Current account", "Cash in hand", "Sweep-in FD"];
export const ASSET_CLASS_SUGGESTIONS = ["Equity", "Debt", "Hybrid", "Gold", "International equity", "Liquid"];
export const COMPOUNDING_OPTIONS = ["Monthly", "Quarterly", "Half-Yearly", "Annually", "Simple", "Cumulative"];
export const PREMIUM_FREQUENCIES = ["Yearly", "Half-Yearly", "Quarterly", "Monthly", "Single"];
export const COVER_TYPE_LABEL = { HP: "Health policy", PA: "Personal accident", CI: "Critical illness" } as const;
