"""
Builds docs/Input_Mapping.xlsx: every input on the Client Data Gathering Sheet,
mapped to where it lives in the app and the database.

To update: edit the rows below (status, screen, notes), add a CHANGELOG line,
then run   python scripts/input-mapping/build_input_mapping.py
Statuses:
  Built            on screen and in the database design, same meaning as the sheet
                   (saving to the live database arrives in Phase 1B)
  Built, changed   built, but entered or shown differently from the sheet (see Notes)
  Calculated       a formula on the sheet; the app works it out the same way
  Partly built     some of it exists (e.g. database only), see Notes
  Not built        not in the app yet
"""
from pathlib import Path
from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "Input_Mapping.xlsx"
STATUSES = ["Built", "Built, changed", "Calculated", "Partly built", "Not built"]

# (sheet tab, section, input as on the sheet, sheet column/cell, screen in the app, field in the app, database column, status, notes)
P, G, A, L, I = "Personal Details", "Goals", "Assets", "Liabilities", "Insurance"
FAM = "Client › Family › Add / Edit member"
ROWS = [
    # ---------------- Personal Details: family ----------------
    (P, "Family", "Full Name", "B5:B8", FAM, "Full name", "family_members.full_name", "Built", ""),
    (P, "Family", "Relationship", "C5:C8", FAM, "Relationship", "family_members.relationship", "Built", "Free text with suggestions, as on the sheet."),
    (P, "Family", "Occupation", "D5:D8", FAM, "Occupation", "family_members.occupation", "Built", ""),
    (P, "Family", "Date of Birth", "E5:E8", FAM, "Date of birth", "family_members.date_of_birth", "Built", ""),
    (P, "Family", "Current Age", "F5:F8 (formula)", "Client › Family table", "Age", "(calculated)", "Calculated", "Same rule as the sheet: this year minus year of birth."),
    (P, "Family", "Retirement Age", "G5:G8", FAM, "Retirement age", "family_members.retirement_age", "Built", "Drives every date tied to retirement."),
    (P, "Family", "Life Expectancy", "H5:H8 (default 85)", FAM, "Life expectancy", "family_members.life_expectancy", "Built", "Defaults to 85, as on the sheet."),
    (P, "Family", "Financially Dependent", "I5:I8", FAM, "Financially dependent", "family_members.financially_dependent", "Built", ""),
    (P, "Family", "Health Status", "J5:J8", FAM, "Health status", "family_members.health_status", "Built", "One field, also shown on the Insurance tab (sheet asks twice)."),
    (P, "Family", "PAN Number", "K5:K8", FAM, "PAN", "family_members.pan_number", "Built", "Format checked: ABCDE1234F."),
    (P, "Family", "Mobile", "L5:L8", FAM, "Mobile", "family_members.mobile", "Built", ""),
    (P, "Family", "Email", "M5:M8", FAM, "Email", "family_members.email", "Built", ""),
    (P, "Family", "Residence Status (Resident / NRI)", "N5:N8", FAM, "Residence status", "family_members.residence_status", "Built", ""),
    (P, "Family", "Company / Business Name & Designation", "O5:O8", FAM, "Company or business, and designation", "family_members.company_designation", "Built", ""),
    # ---------------- Personal Details: income ----------------
    (P, "Income (post tax)", "Name", "B12:B15", "Client › Income and expenses › Income", "Earned by", "incomes.member_id", "Built", ""),
    (P, "Income (post tax)", "Income Type", "C12:C15", "Client › Income and expenses › Income", "Income type", "incomes.income_type", "Built", "Same 4 options as the sheet dropdown."),
    (P, "Income (post tax)", "Frequency", "D12:D15", "Client › Income and expenses › Income", "Frequency", "incomes.frequency", "Built", "Monthly / Half-Yearly / Annually, as on the sheet."),
    (P, "Income (post tax)", "Monthly", "E12:E15", "Client › Income and expenses › Income", "Amount each time, after tax", "incomes.amount", "Built, changed", "One amount per payment instead of a Monthly column. OPEN QUESTION: how Omnimax converts half-yearly and annual income."),
    (P, "Income (post tax)", "Annually", "F12:F15 (formula: Monthly × 12)", "Client › Income and expenses › Income", "Per year", "(calculated)", "Built, changed", "App: amount × payments a year (12 / 2 / 1). Sheet: always Monthly × 12."),
    (P, "Income (post tax)", "Total income", "E16:F16 (formula)", "Client › Income and expenses › Income", "Total row", "(calculated)", "Calculated", ""),
]
EXPENSES = [
    ("Household", "Food, Grocery, Gas Etc.", 20), ("Household", "Mobile / Telephone / Internet", 21),
    ("Household", "Electricity / Water / Labour / AMCs / Security", 22), ("Household", "House Help / Maid", 23),
    ("Household", "House Rent / Maintenance / Repair", 24), ("Household", "Household Appliances", 25),
    ("Household", "Conveyance, Fuel & Maintenance", 26), ("Household", "Vehicle Insurance & Maintenance", 27),
    ("Household", "Property Tax", 28), ("Household", "Medicines / Doctor / Healthcare / Preventive Checkup", 29),
    ("Lifestyle", "Clothes & Accessories", 31), ("Lifestyle", "Shopping, Gifts, Whitegoods, Gadgets", 32),
    ("Lifestyle", "Dining / Movies / Sports", 33), ("Lifestyle", "Personal Care / Others", 34),
    ("Misc", "Travel & Annual Vacations", 36), ("Misc", "Children's Schooling/College Expenses", 37),
    ("Misc", "Contribution to Parents, Siblings etc", 38), ("Misc", "Donation / Charity", 39),
]
for grp, name, r in EXPENSES:
    ROWS.append((P, f"Expenses: {grp}", f"{name} (Monthly)", f"C{r}", "Client › Income and expenses › Expenses", name, "expenses.monthly_amount", "Built", ""))
ROWS += [
    (P, "Expenses", "Annually (each line)", "D20:D39 (formula: Monthly × 12)", "Client › Income and expenses › Expenses", "Annually", "(calculated)", "Calculated", ""),
    (P, "Expenses", "Household / Lifestyle / Misc subtotals", "C30:D30, C35:D35, C40:D40 (formula)", "Client › Income and expenses › Expenses", "Group rows", "(calculated)", "Calculated", ""),
    (P, "Expenses", "Total Expenses", "C41:D41 (formula)", "Client › Income and expenses › Expenses", "Total expenses", "(calculated)", "Calculated", ""),
    (P, "Remark", "Remark", "B43", "Client › Edit household", "Remarks", "clients.remarks", "Built", "Shown on the Family tab as Adviser remarks."),
]
GOALS = "Client › Goals › Add / Edit goal"
ROWS += [
    # ---------------- Goals ----------------
    (G, "Retirement", "Name", "B5:B6", GOALS, "Whose retirement", "goals.member_id", "Built", "Goal type = Retirement."),
    (G, "Retirement", "Current Age / Retirement Age / Life Expectancy", "C5:E6 (formulas from Personal Details)", "Client › Family", "From the family member", "(from family_members)", "Calculated", "Not re-entered: taken from the Family tab, like the sheet."),
    (G, "Retirement", "Current Monthly Expenses", "F5:F6", GOALS, "Current monthly expenses", "goals.current_monthly_expenses", "Built", ""),
    (G, "Retirement", "Priority (H/M/L)", "G5:G6", GOALS, "Priority", "goals.priority_level", "Built", "Plus a funding order number (see Added sheet)."),
    (G, "Education", "Who are you planning this for?", "B11:B12", GOALS, "Who is this for", "goals.member_id", "Built", ""),
    (G, "Education", "Start Age", "C11:C12", GOALS, "Age when the course starts", "goals.start_age", "Built", ""),
    (G, "Education", "Course Tenure (years)", "D11:D12 (default 3)", GOALS, "Course length in years", "goals.tenure_years", "Built", "Defaults to 3, as on the sheet."),
    (G, "Education", "Annual Course expenses in today's value", "E11:E12", GOALS, "Annual course cost in today's value", "goals.cost_today", "Built", ""),
    (G, "Education", "Total Expenses in today's value (p.a. × years)", "F11:F12 (formula)", "Client › Goals table", "Today's value", "(calculated)", "Calculated", "Annual cost × course length, as on the sheet."),
    (G, "Education", "Priority (H/M/L)", "G11:G12", GOALS, "Priority", "goals.priority_level", "Built", ""),
    (G, "Marriage", "Who are you planning this for?", "B16:B17", GOALS, "Who is this for", "goals.member_id", "Built", ""),
    (G, "Marriage", "Age at the time of marriage", "C16:C17", GOALS, "Age at marriage", "goals.start_age", "Built", ""),
    (G, "Marriage", "Marriage expenses in today's value", "D16:D17", GOALS, "Marriage cost in today's value", "goals.cost_today", "Built", ""),
    (G, "Marriage", "Priority (H/M/L)", "E16:E17", GOALS, "Priority", "goals.priority_level", "Built", ""),
    (G, "Vacation", "Start Year", "B22:B23", GOALS, "First trip year", "goals.start_year", "Built", ""),
    (G, "Vacation", "End Year", "C22:C23", GOALS, "Last trip year", "goals.end_year", "Built", ""),
    (G, "Vacation", "Travel expenses in today's value", "D22:D23", GOALS, "Cost per trip in today's value", "goals.cost_today", "Built", ""),
    (G, "Vacation", "Travelling Frequency", "E22:E23", GOALS, "Travel every how many years", "goals.frequency_years", "Built, changed", "Sheet gives no unit; read as 'every N years'. OPEN QUESTION."),
    (G, "Vacation", "Priority (H/M/L)", "F22:F23", GOALS, "Priority", "goals.priority_level", "Built", ""),
    (G, "House / Car", "What are you planning for? (Dream House / Decent Car)", "B27:B28", GOALS, "Goal type (House / Car) + goal name", "goals.goal_type, goals.name", "Built", "Dream House / Decent Car offered as name suggestions."),
    (G, "House / Car", "When are you planning to buy?", "C27:C28", GOALS, "Year of purchase", "goals.start_year", "Built", ""),
    (G, "House / Car", "Cost as on today", "D27:D28", GOALS, "Cost as on today", "goals.cost_today", "Built", ""),
    (G, "House / Car", "Will you go for Loan? If yes, how much?", "E27:E28", GOALS, "Loan amount, if any", "goals.loan_amount", "Built", ""),
    (G, "House / Car", "Priority (H/M/L)", "F27:F28", GOALS, "Priority", "goals.priority_level", "Built", ""),
    (G, "Other goals", "Goal", "B32:B35", GOALS, "Goal name", "goals.name", "Built", "Goal type = Other."),
    (G, "Other goals", "Yes / No", "C32:C35", GOALS, "Client wants this goal", "goals.is_wanted", "Built", ""),
    (G, "Other goals", "Time Frame", "D32:D35", GOALS, "Time frame", "goals.time_frame", "Built", "Free text, as on the sheet."),
    (G, "Other goals", "Amount", "E32:E35", GOALS, "Amount", "goals.cost_today", "Built", ""),
    (G, "Other goals", "Priority (H/M/L)", "F32:F35", GOALS, "Priority", "goals.priority_level", "Built", ""),
]
AS = "Client › Assets › "
ROWS += [
    # ---------------- Assets ----------------
    (A, "Real estate", "Owner Name", "B5:B8", AS + "Real estate", "Owner", "assets.owner_member_id", "Built", ""),
    (A, "Real estate", "Property Type", "C5:C8", AS + "Real estate", "Property type", "assets.sub_type", "Built", "Same 5 options as the sheet dropdown."),
    (A, "Real estate", "City / State", "D5:D8", AS + "Real estate", "City / state", "assets.location", "Built", ""),
    (A, "Real estate", "Purchase Year", "E5:E8", AS + "Real estate", "Purchase year", "assets.start_date", "Built", "Stored as 1 January of that year."),
    (A, "Real estate", "Purchase Value", "F5:F8", AS + "Real estate", "Purchase value", "assets.invested_amount", "Built", ""),
    (A, "Real estate", "Market Value", "G5:G8", AS + "Real estate", "Market value", "assets.current_value", "Built", ""),
    (A, "Real estate", "Goal", "H5:H8", AS + "Real estate", "Reserved for goals (Priority goal 1, 2, 3)", "goal_funding_links", "Built, changed", "One goal on the sheet; up to 3 ranked goals in the app, as in Input_Allocations.py. Problem 11 open: keep Priority goal 3?"),
    (A, "Cash & savings bank", "Owner Name", "B12:B14", AS + "Cash and savings bank accounts", "Owner", "assets.owner_member_id", "Built", ""),
    (A, "Cash & savings bank", "Asset Type", "C12:C14", AS + "Cash and savings bank accounts", "Asset type", "assets.sub_type", "Built", "Free text with suggestions."),
    (A, "Cash & savings bank", "Current Value", "D12:D14", AS + "Cash and savings bank accounts", "Current value", "assets.current_value", "Built", ""),
    (A, "Cash & savings bank", "Remark", "E12:E14", AS + "Cash and savings bank accounts", "Remark", "assets.remark", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Investor Name", "B18:B21", AS + "FD, bonds…", "Investor", "assets.owner_member_id", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Type", "C18:C21", AS + "FD, bonds…", "Type", "assets.sub_type", "Built", "List built from the section heading (FD, NBFC FD, Bonds…)."),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Name of Bank / Institute / Depositor", "D18:D21", AS + "FD, bonds…", "Bank, institution or depositor", "assets.institution", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Amount Invested", "E18:E21", AS + "FD, bonds…", "Amount invested", "assets.invested_amount", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Maturity value", "F18:F21", AS + "FD, bonds…", "Maturity value", "assets.maturity_value", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Commencement Date", "G18:G21", AS + "FD, bonds…", "Start date", "assets.start_date", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Maturity Date", "H18:H21", AS + "FD, bonds…", "Maturity date", "assets.maturity_date", "Built", "Checked to be after the start date."),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Interest / Coupon Rate", "I18:I21", AS + "FD, bonds…", "Interest / coupon rate", "assets.interest_rate_pct", "Built", ""),
    (A, "FD / bonds / POMIS / KVP / SCSS / NSC", "Interest Compounding", "J18:J21", AS + "FD, bonds…", "Interest compounding", "assets.compounding", "Built", "Options are our list; the sheet leaves it free."),
    (A, "PPF / RD / NPS", "Investor Name", "B25:B26", AS + "PPF, RD, NPS", "Investor", "assets.owner_member_id", "Built", ""),
    (A, "PPF / RD / NPS", "Account Type", "C25:C26", AS + "PPF, RD, NPS", "Account type", "assets.sub_type", "Built", ""),
    (A, "PPF / RD / NPS", "Investment Amount (Principal)", "D25:D26", AS + "PPF, RD, NPS", "Investment amount (principal)", "assets.invested_amount", "Built", ""),
    (A, "PPF / RD / NPS", "Purchase Date", "E25:E26", AS + "PPF, RD, NPS", "Purchase date", "assets.start_date", "Built", ""),
    (A, "PPF / RD / NPS", "Maturity Date", "F25:F26", AS + "PPF, RD, NPS", "Maturity date", "assets.maturity_date", "Built", ""),
    (A, "PPF / RD / NPS", "Maturity Value", "G25:G26", AS + "PPF, RD, NPS", "Maturity value", "assets.maturity_value", "Built", ""),
    (A, "PPF / RD / NPS", "Contribution (per month)", "H25:H26", AS + "PPF, RD, NPS", "Contribution per month", "assets.monthly_contribution", "Built", ""),
    (A, "Retirement accounts", "Owner Name", "B29:B30", AS + "Retirement accounts", "Owner", "assets.owner_member_id", "Built", ""),
    (A, "Retirement accounts", "Current EPF Balance", "C29:C30", AS + "Retirement accounts", "Current balance", "assets.current_value", "Built", ""),
    (A, "Retirement accounts", "Balance as on", "D29:D30", AS + "Retirement accounts", "Balance as on", "assets.value_as_of", "Built", ""),
    (A, "Retirement accounts", "Account Type", "E29:E30", AS + "Retirement accounts", "Account type", "assets.sub_type", "Built", "EPF / Superannuation / Gratuity."),
    (A, "Retirement accounts", "Employee's Monthly Contribution", "F29:F30", AS + "Retirement accounts", "Employee's monthly contribution", "assets.monthly_contribution", "Built", ""),
    (A, "Retirement accounts", "Employer's Monthly Contribution", "G29:G30", AS + "Retirement accounts", "Employer's monthly contribution", "assets.employer_monthly_contribution", "Built", ""),
    (A, "Retirement accounts", "Remark", "H29:H30", AS + "Retirement accounts", "Remark", "assets.remark", "Built", ""),
    (A, "Gold / silver", "Investor Name", "B33:B34", AS + "Gold and silver", "Investor", "assets.owner_member_id", "Built", ""),
    (A, "Gold / silver", "Asset Type", "C33:C34", AS + "Gold and silver", "Asset type", "assets.sub_type", "Built", "Same 4 options as the sheet dropdown."),
    (A, "Gold / silver", "Investment Amount (Principal)", "D33:D34", AS + "Gold and silver", "Investment amount (principal)", "assets.invested_amount", "Built", ""),
    (A, "Gold / silver", "Current Value", "E33:E34", AS + "Gold and silver", "Current value", "assets.current_value", "Built", ""),
    (A, "Gold / silver", "Yearly Investment Amount", "F33:F34", AS + "Gold and silver", "Yearly investment amount", "assets.yearly_contribution", "Built", ""),
    (A, "Miscellaneous", "Investor Name", "B37:B38", AS + "Miscellaneous assets", "Investor", "assets.owner_member_id", "Built", ""),
    (A, "Miscellaneous", "Asset Type", "C37:C38", AS + "Miscellaneous assets", "Asset type", "assets.sub_type", "Built", ""),
    (A, "Miscellaneous", "Investment Amount (Principal)", "D37:D38", AS + "Miscellaneous assets", "Investment amount (principal)", "assets.invested_amount", "Built", ""),
    (A, "Miscellaneous", "Current Value", "E37:E38", AS + "Miscellaneous assets", "Current value", "assets.current_value", "Built", ""),
    (A, "Miscellaneous", "Yearly Investment Amount", "F37:F38", AS + "Miscellaneous assets", "Yearly investment amount", "assets.yearly_contribution", "Built", ""),
    (A, "Miscellaneous", "Expected Growth Rate", "G37:G38", AS + "Miscellaneous assets", "Expected growth rate", "assets.expected_growth_pct", "Built", ""),
    (A, "Mutual funds & SIP", "Holder Name", "B41:B47", AS + "Mutual funds and SIPs", "Holder", "assets.owner_member_id", "Built", ""),
    (A, "Mutual funds & SIP", "Scheme Name", "C41:C47", AS + "Mutual funds and SIPs", "Scheme name", "assets.name", "Built", ""),
    (A, "Mutual funds & SIP", "Assetclass", "D41:D47", AS + "Mutual funds and SIPs", "Asset class", "assets.asset_class", "Built", "Drives which return rate applies."),
    (A, "Mutual funds & SIP", "Market Value", "E41:E47", AS + "Mutual funds and SIPs", "Market value", "assets.current_value", "Built", ""),
    (A, "Mutual funds & SIP", "SIP (per month)", "F41:F47", AS + "Mutual funds and SIPs", "SIP per month", "assets.monthly_contribution", "Built", ""),
    (A, "Mutual funds & SIP", "Totals", "E48:F48 (formula)", AS + "Mutual funds and SIPs", "Total row", "(calculated)", "Calculated", ""),
    (A, "Equity stocks / PMS", "Holder Name", "B52:B58", AS + "Equity stocks and PMS", "Holder", "assets.owner_member_id", "Built", ""),
    (A, "Equity stocks / PMS", "Script", "C52:C58", AS + "Equity stocks and PMS", "Script", "assets.name", "Built", ""),
    (A, "Equity stocks / PMS", "Quantity", "D52:D58", AS + "Equity stocks and PMS", "Quantity", "assets.quantity", "Built", ""),
    (A, "Equity stocks / PMS", "Buy Price", "E52:E58", AS + "Equity stocks and PMS", "Buy price per share", "assets.buy_price", "Built", ""),
    (A, "Equity stocks / PMS", "Current Value", "F52:F58", AS + "Equity stocks and PMS", "Current value", "assets.current_value", "Built", ""),
    (A, "Equity stocks / PMS", "Totals", "E59:F59 (formula)", AS + "Equity stocks and PMS", "Total row", "(calculated)", "Built, changed", "App totals Current value only. The sheet also adds up Buy Price per share, which isn't a meaningful total; confirm."),
    (A, "Notes", "p.s. provide copy of demat statement", "B62", AS + "Equity stocks and PMS", "Footnote", "—", "Built", "Shown as a reminder. Uploading documents is not in scope yet."),
]
ROWS += [
    # ---------------- Liabilities ----------------
    (L, "Loans", "Owner Name", "B4:B5", "Client › Liabilities › Loans", "Owner", "liabilities.owner_member_id", "Built", ""),
    (L, "Loans", "Loan Type", "C4:C5", "Client › Liabilities › Loans", "Loan type", "liabilities.loan_type", "Built", "Same 5 options as the sheet dropdown."),
    (L, "Loans", "Principal Amount Outstanding", "D4:D5", "Client › Liabilities › Loans", "Principal outstanding", "liabilities.principal_outstanding", "Built", ""),
    (L, "Loans", "EMI Amount", "E4:E5", "Client › Liabilities › Loans", "EMI amount", "liabilities.emi_amount", "Built", ""),
    (L, "Loans", "EMI Continues till (mmm-yyyy)", "F4:F5", "Client › Liabilities › Loans", "EMI continues till", "liabilities.emi_end_month", "Built", ""),
    (L, "Loans", "Interest Rate (%)", "G4:G5", "Client › Liabilities › Loans", "Interest rate", "liabilities.interest_rate_pct", "Built", ""),
    (L, "Loans", "Name of Financial Institution / Lender", "H4:H5", "Client › Liabilities › Loans", "Financial institution or lender", "liabilities.lender", "Built", ""),
    (L, "Loans", "Totals", "D6:E6 (formula)", "Client › Liabilities › Loans", "Total row", "(calculated)", "Calculated", ""),
    (L, "Loans", "p.s. provide loan amortisation schedule", "B6", "Client › Liabilities › Loans", "Footnote", "—", "Built", "Shown as a reminder."),
    (L, "Credit cards", "How many credit cards do you have?", "C9", "Client › Liabilities › Credit cards", "Same question", "credit_card_profiles.card_count", "Built", ""),
    (L, "Credit cards", "What is the current outstanding amount?", "C10", "Client › Liabilities › Credit cards", "Same question", "credit_card_profiles.outstanding_amount", "Built", ""),
    (L, "Credit cards", "Do you pay your bills in full or make partial payments?", "C11", "Client › Liabilities › Credit cards", "Same question", "credit_card_profiles.payment_behaviour", "Built", ""),
    (L, "Credit cards", "What is your yearly credit card usage?", "C12", "Client › Liabilities › Credit cards", "Same question", "credit_card_profiles.yearly_usage", "Built", ""),
    (L, "Credit cards", "How long have you been using credit cards?", "C13", "Client › Liabilities › Credit cards", "Same question (years)", "credit_card_profiles.years_using", "Built", ""),
]
INS = "Client › Insurance › "
ROWS += [
    # ---------------- Insurance ----------------
    (I, "Health status", "Name", "B4:B7", INS + "Health status", "From the family member", "family_members", "Built", "Shown from the Family tab; edited there."),
    (I, "Health status", "Tobacco Consumption (Y / N)", "C4:C7", FAM, "Uses tobacco", "family_members.tobacco_user", "Built", ""),
    (I, "Health status", "Health Status", "D4:D7", FAM, "Health status", "family_members.health_status", "Built", "Same field as Personal Details › Health Status."),
    (I, "Health status", "Health History", "E4:E7", FAM, "Health history", "family_members.health_history", "Built", ""),
    (I, "Health status", "Remark", "F4:F7", FAM, "Health remark", "family_members.health_remark", "Built", "Added to the form on 20-Nov-2026 (was database only)."),
]
LIFE = INS + "Life insurance"
for col, label, field, dbcol, note in [
    ("B", "Insured Name", "Insured", "insured_member_id", ""), ("C", "Policy Name", "Policy name", "policy_name", ""),
    ("D", "Policy Number", "Policy number", "policy_number", ""), ("E", "Commencement Date", "Commencement date", "commencement_date", ""),
    ("F", "Sum Assured (SA)", "Sum assured", "sum_assured", ""), ("G", "Premium Amount", "Premium amount", "premium_amount", ""),
    ("H", "Premium Frequency (yearly / Monthly)", "Premium frequency", "premium_frequency", "App also offers Half-Yearly, Quarterly, Single."),
    ("I", "Policy Term (Years)", "Policy term (years)", "policy_term_years", ""), ("J", "Premium Paying Term (PPT Years)", "Premium paying term (years)", "ppt_years", "Checked not longer than the policy term."),
    ("K", "Surrender Value", "Surrender value", "surrender_value", ""), ("L", "Maturity Value", "Maturity value", "maturity_value", ""),
    ("M", "Riders", "Riders", "riders", ""), ("N", "Nominee Name", "Nominee name", "nominee_name", ""),
    ("O", "Policy Status (Active / Lapsed)", "Policy status", "status", ""),
]:
    ROWS.append((I, "Life insurance", label, f"{col}11:{col}14", LIFE, field, f"life_insurance_policies.{dbcol}", "Built", note))
ROWS.append((I, "Life insurance", "Totals (SA, premium)", "F15:G15 (formula)", LIFE, "Total row", "(calculated)", "Calculated", ""))
GEN = INS + "General insurance"
for col, label, field, dbcol, note in [
    ("B", "Insured Name", "Insured", "insured_member_id", "For a floater, the main person covered. OPEN QUESTION: enough?"),
    ("C", "Policy Name", "Policy name", "policy_name", ""),
    ("D", "Policy Type (Individual / Floater / Group)", "Policy type", "policy_type", ""),
    ("E", "Commencement Date", "Commencement date", "commencement_date", ""), ("F", "Sum Assured (SA)", "Sum assured", "sum_assured", ""),
    ("G", "Annual Premium Amount", "Annual premium", "annual_premium", ""), ("H", "Tenure (Years)", "Tenure (years)", "tenure_years", ""),
    ("I", "Renewal Date", "Renewal date", "renewal_date", ""),
]:
    ROWS.append((I, "General insurance", label, f"{col}19:{col}22", GEN, field, f"general_insurance_policies.{dbcol}", "Built", note))
ROWS += [
    (I, "General insurance", "Totals (SA, premium)", "F23:G23 (formula)", GEN, "Total row", "(calculated)", "Calculated", ""),
    (I, "Notes", "p.s. provide copy of insurance policies", "B24", GEN, "Footnote", "—", "Built", "Shown as a reminder."),
]

# Inputs the app has that the sheet does not, and why
ADDED = [
    ("Client", "Client code", "Client list / profile", "clients.client_code", "App need", "Made automatically (CL-0001…)."),
    ("Client", "Household name, status, adviser", "Add client / Edit household", "clients.household_name, status, adviser_id", "App need", "For the client list and role access."),
    ("Income", "Yearly growth %", "Income and expenses › Income", "incomes.annual_growth_pct", "Project plan (Phase 1A: income growth)", ""),
    ("Income", "Starts in (year)", "Income and expenses › Income", "incomes.start_year", "Project plan (start and end year)", ""),
    ("Income", "Ends: at retirement / set year / for life", "Income and expenses › Income", "incomes.end_rule, end_year", "Project plan; Problems 1 and 12", "'At retirement' moves with the retirement age."),
    ("Income", "Reserved for goals (Priority goal 1/2/3)", "Income and expenses › Income", "goal_funding_links.income_id", "Input_Allocations.py (income investments, levels 1/3/5/7)", ""),
    ("Goals", "Goal name (all types)", "Goals", "goals.name", "App need", "So goals can be told apart in results."),
    ("Goals", "Funding order (1, 2, 3…)", "Goals (arrows)", "goals.priority_rank", "Problem 7; Input_Allocations.py priority", "OPEN QUESTION: how H/M/L maps to it."),
    ("Goals", "Inflation for this goal", "Goals", "goals.inflation_pct", "Problem 9; project plan", "Blank = plan rate for the goal type."),
    ("Assets", "Reserved for goals on every asset (Priority goal 1/2/3)", "Assets (all sections)", "goal_funding_links.asset_id", "Input_Allocations.py (Investments sheet)", "Sheet has a Goal column for real estate only."),
    ("Assets", "Bank (cash accounts)", "Assets › Cash", "assets.institution", "App need", ""),
    ("Assets", "SIP yearly step-up %", "Assets › Mutual funds", "assets.annual_step_up_pct", "Project plan; Problem 16", ""),
    ("Assets", "Contributions stop: at retirement / set year", "Assets (sections with contributions)", "assets.contribution_end_rule, contribution_end_year", "Project plan; Problems 1 and 12", ""),
    ("Assets", "Can be used for goals from (year)", "Assets (all sections)", "assets.available_from_year", "Project plan (year it can be used from)", "e.g. PPF lock-in."),
    ("Insurance", "Cover type (HP / PA / CI)", "Insurance › General", "general_insurance_policies.cover_type", "Sheet section heading", "The heading names the cover types but has no column."),
    ("Assumptions", "Returns per asset class and period", "Firm assumptions; client Assumptions tab", "return_assumptions", "Project plan; Problem 1", "Periods end in a year, at retirement, or open."),
    ("Assumptions", "Inflation per goal type", "Firm assumptions; client Assumptions tab", "inflation_assumptions", "Project plan; Problem 9", ""),
    ("What-if", "Scenario changes: retirement ages, returns, inflation, goals", "Client › What-if", "scenarios.changes", "Project plan; Problem 13", ""),
    ("Staff", "Users and roles (adviser / operations / admin)", "Sign-in; Staff and roles", "users", "Project plan", "Advisers have full access to their own clients (decided 20-Nov-2026)."),
]

CHANGELOG = [
    ("2026-11-20", "Sheet created: every input on the Client Data Gathering Sheet mapped to the app."),
    ("2026-11-20", "Insurance › Health Status › Remark added to the family member form (was in the database only)."),
]

# ---------------- workbook ----------------
FONT = "Arial"
HEAD_FILL = PatternFill("solid", fgColor="14213D")
SUB_FILL = PatternFill("solid", fgColor="F7F8FA")
thin = Side(style="thin", color="D3D7E0")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)


def header(ws, cols, widths):
    for i, (c, w) in enumerate(zip(cols, widths), start=1):
        cell = ws.cell(row=1, column=i, value=c)
        cell.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
        cell.fill = HEAD_FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        cell.border = BORDER
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"


def body(ws, rows, start=2):
    for r, row in enumerate(rows, start=start):
        for c, v in enumerate(row, start=1):
            cell = ws.cell(row=r, column=c, value=v)
            cell.font = Font(name=FONT, size=10)
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = BORDER
    ws.auto_filter.ref = f"A1:{get_column_letter(len(rows[0]))}{start + len(rows) - 1}"


wb = Workbook()

# 1. Mapping
ws = wb.active
ws.title = "Input Mapping"
cols = ["#", "Sheet tab", "Section", "Input on client sheet", "Sheet cells", "Where in the app", "Field in the app", "Database column", "Status", "Notes"]
header(ws, cols, [5, 15, 22, 36, 22, 34, 30, 34, 15, 52])
data = [(i,) + row for i, row in enumerate(ROWS, start=1)]
body(ws, data)
last = len(data) + 1
dv = DataValidation(type="list", formula1='"' + ",".join(STATUSES) + '"', allow_blank=False)
ws.add_data_validation(dv)
dv.add(f"I2:I{last}")
colors = {"Built": "E8F3F0", "Built, changed": "FBF3E4", "Calculated": "EAF1FB", "Partly built": "FDEFE3", "Not built": "FDECEA"}
for status, fill in colors.items():
    ws.conditional_formatting.add(f"I2:I{last}", FormulaRule(formula=[f'$I2="{status}"'], fill=PatternFill("solid", fgColor=fill)))

# 2. Added in the app
ws2 = wb.create_sheet("Added (not on sheet)")
header(ws2, ["#", "Area", "Input in the app", "Where in the app", "Database column", "Why it was added", "Notes"], [5, 14, 42, 36, 40, 40, 44])
body(ws2, [(i,) + row for i, row in enumerate(ADDED, start=1)])

# 3. Summary (formulas, so it updates when statuses change)
ws3 = wb.create_sheet("Summary", 0)
ws3.column_dimensions["A"].width = 34
ws3.column_dimensions["B"].width = 14
ws3.column_dimensions["C"].width = 14
ws3["A1"] = "Client Data Gathering Sheet: build coverage"
ws3["A1"].font = Font(name=FONT, bold=True, size=14, color="14213D")
ws3["A2"] = "Counts update from the Status column on the Input Mapping sheet. \"Built\" = on screen and in the database design; saving to the live database arrives in Phase 1B."
ws3["A2"].font = Font(name=FONT, size=10, color="5B6475")
for c, h in zip("ABC", ["Status", "Inputs", "Share"]):
    cell = ws3[f"{c}4"]
    cell.value = h
    cell.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
    cell.fill = HEAD_FILL
    cell.border = BORDER
for i, s in enumerate(STATUSES, start=5):
    ws3[f"A{i}"] = s
    ws3[f"B{i}"] = f"=COUNTIF('Input Mapping'!$I$2:$I${last},A{i})"
    ws3[f"C{i}"] = f"=IF($B$10=0,0,B{i}/$B$10)"
    ws3[f"C{i}"].number_format = "0%"
    for c in "ABC":
        ws3[f"{c}{i}"].font = Font(name=FONT, size=10)
        ws3[f"{c}{i}"].border = BORDER
        ws3[f"{c}{i}"].fill = PatternFill("solid", fgColor=colors[s]) if c == "A" else PatternFill()
ws3["A10"] = "Total inputs on the sheet"
ws3["B10"] = f"=COUNTA('Input Mapping'!$D$2:$D${last})"
ws3["A11"] = "Covered (Built, changed, or Calculated)"
ws3["B11"] = "=B5+B6+B7"
ws3["C11"] = "=IF($B$10=0,0,B11/$B$10)"
ws3["C11"].number_format = "0%"
ws3["A12"] = "Inputs added in the app (not on the sheet)"
ws3["B12"] = f"=COUNTA('Added (not on sheet)'!$C$2:$C${len(ADDED) + 1})"
for r in (10, 11, 12):
    for c in "ABC":
        ws3[f"{c}{r}"].font = Font(name=FONT, size=10, bold=(r == 11))
        ws3[f"{c}{r}"].border = BORDER
ws3["A14"] = "Status meanings"
ws3["A14"].font = Font(name=FONT, bold=True, size=11)
meanings = [
    ("Built", "On screen and in the database, same meaning as the sheet."),
    ("Built, changed", "Built, but entered or shown differently from the sheet. See Notes."),
    ("Calculated", "A formula on the sheet; the app works it out the same way."),
    ("Partly built", "Some of it exists (e.g. database only). See Notes."),
    ("Not built", "Not in the app yet."),
]
for i, (s, m) in enumerate(meanings, start=15):
    ws3[f"A{i}"] = s
    ws3[f"B{i}"] = m
    ws3[f"A{i}"].font = Font(name=FONT, size=10, bold=True)
    ws3[f"B{i}"].font = Font(name=FONT, size=10)
ws3["A21"] = "How to update"
ws3["A21"].font = Font(name=FONT, bold=True, size=11)
ws3["A22"] = "Edit scripts/input-mapping/build_input_mapping.py, add a Change log line, and run it. The file is rebuilt from the script."
ws3["A22"].font = Font(name=FONT, size=10)

# 4. Change log
ws4 = wb.create_sheet("Change log")
header(ws4, ["Date", "Change"], [14, 100])
body(ws4, CHANGELOG)

OUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUT)
print(f"wrote {OUT} ({len(ROWS)} sheet inputs, {len(ADDED)} added)")
