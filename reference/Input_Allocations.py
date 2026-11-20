import pandas as pd
import numpy as np
import numpy_financial as npf
from collections import defaultdict
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils.dataframe import dataframe_to_rows

excel_file = "Step2_PQ1_SourceData.xlsx"

### === Query 2: Goal Sheet (priority lookup) ===

gs_sheet = pd.read_excel(excel_file, sheet_name="Omnimax Output", header=None)
gs_transposed = gs_sheet.transpose()
gs_filtered = gs_transposed[gs_transposed.iloc[:, 1] == "Amount Required"]
gs_only = gs_filtered[[gs_filtered.columns[0]]].copy()
gs_only = gs_only.reset_index(drop=True)
gs_only['Priority'] = gs_only.index + 1
gs_only.columns = ["Goal Sheet", "Priority"]

# This is used for merging in Query 1


### === Query 1: Goals table with priorities ===

df1 = pd.read_excel(excel_file, sheet_name="Omnimax Output", header=None)
df1 = df1.drop(df1.index[0]).reset_index(drop=True)
df1[0] = df1[0].bfill()
df1 = df1.transpose()
df1.iloc[:, 0] = df1.iloc[:, 0].ffill()
df1 = df1[(df1.iloc[:, 1] == "Year") | (df1.iloc[:, 1] == "Amount Required")]
df1 = df1.transpose().reset_index(drop=True)
df1.columns = df1.iloc[0].tolist()
df1 = df1.drop(df1.index[0]).reset_index(drop=True)
melt_columns = [col for col in df1.columns if col != "Year"]
df1 = df1.melt(id_vars=["Year"], value_vars=melt_columns, var_name="Attribute", value_name="Value")
df1 = df1[(df1["Value"].notna()) & (df1["Value"] != "Amount Required")]

# Merge with priorities using Attribute <-> Goal Sheet
df1_merged = df1.merge(gs_only, left_on="Attribute", right_on="Goal Sheet", how="left")

# Reorder columns and rename
df1_final = df1_merged[["Attribute", "Priority", "Year", "Value"]].copy()
df1_final = df1_final.rename(columns={"Attribute": "Goal name", "Value": "Amount"})


### === Query 3: Withdrawals, with asset/income classification ===

df3 = pd.read_excel(excel_file, sheet_name="Omnimax Output", header=None)
df3 = df3.drop(df3.index[0]).reset_index(drop=True)
df3[0] = df3[0].bfill()
df3 = df3.transpose()
df3.iloc[:, 0] = df3.iloc[:, 0].ffill()
df3 = df3[(df3.iloc[:, 1] == "Year") | (df3.iloc[:, 1] == "Withdrawals")]
df3 = df3.transpose().reset_index(drop=True)
df3.columns = df3.iloc[0].tolist()
df3 = df3.drop(df3.index[0]).reset_index(drop=True)
melt_columns = [col for col in df3.columns if col != "Year"]
df3 = df3.melt(id_vars=["Year"], value_vars=melt_columns, var_name="Attribute", value_name="Value")
df3 = df3[(df3["Value"] != 0) & (df3["Value"] != "Withdrawals")]
df3_final = df3[["Attribute", "Year", "Value"]].copy()
df3_final = df3_final.rename(columns={"Attribute": "Investments Name", "Value": "Amount Withdrawn"})
df3_final["Category"] = df3_final["Investments Name"].apply(
    lambda x: "Income" if ("income" in str(x).lower() or "pension" in str(x).lower()) else "Asset"
)

### === Query 4: Investments priority mapping (Investments sheet) ===

df4 = pd.read_excel(excel_file, sheet_name="Investments", header=0)
df4 = df4[["Investment Name", "Priority Goal 1", "Priority Goal 2", "Priority Goal 3"]]
df4 = df4[df4["Investment Name"].notnull()]
df4 = df4.rename(columns={"Investment Name": "Investments Name"})


### === Calculating the PV of the withdrawal Amount year wise

# Step 1: Load Excel file - equivalent to Source and sheet selection

df = pd.read_excel(excel_file, sheet_name="Omnimax Output", header=None)
df = df.drop(df.index[0]).reset_index(drop=True)
    # Step 2: Fill Up - equivalent to Table.FillUp for Column1 (first column)

df.iloc[:, 0] = df.iloc[:, 0].ffill()

    # Step 3: Transpose - equivalent to Table.Transpose
df = df.T

    # Step 5: Fill Down - equivalent to Table.FillDown for Column1 (first column)
df.iloc[:, 0] = df.iloc[:, 0].ffill()

    # Step 6: Promote Headers - use first row as headers
df.columns = df.iloc[0]
df = df.drop(df.index[0])
df.reset_index(drop=True, inplace=True)
cols = list(df.columns)
cols[0] = 'Year'
cols[1] = 'Year_1'
df.columns = cols
## df.columns[0] = 'Year'
## df.columns[1] = 'Year_1'

print(df.columns.tolist())

    # Step 7: Unpivot Other Columns - melt all columns except "Year" and "Year_1"
id_vars = ["Year", "Year_1"]  # Assuming these are the column names after promoting headers
df_melted = pd.melt(df, id_vars=id_vars, var_name="Attribute", value_name="Value")

print(df_melted.iloc[:, 3])

    # Step 8: Filter data based on amount funded value greater than 0
df_retirement = df_melted[df_melted.iloc[:, 3] > 0]

# --- CHANGE: Find retirement year from transposed data ---
# Filter for fixed value in first column ("Retirement" or "Retirement Cashflow"), take first, get second column value
retirement_mask = df_retirement.iloc[:, 0].isin(['Retirement Cashflow','Retirement'])
retirement_rows = df_retirement[retirement_mask]
if not retirement_rows.empty:
    retirement_year = retirement_rows.iloc[0, 2]  # first matching row, second column value
    # Convert to int (handles error if not numeric)
    try:
        retirement_year = int(retirement_year)
    except ValueError:
        retirement_year = None
else:
    retirement_year = None  # or set default/fallback as appropriate

    # Step 4: Filter Rows - equivalent to filtering out "Amount Funded" and "Amount Required"
    # Assuming Column2 is now the second column after transpose (index 1)
df_melted = df_melted[~df_melted.iloc[:, 1].isin(["Amount Funded", "Amount Required","Year"])]

    # Step 8: Pivot Column - pivot on "Year_1" column
df_pivoted = df_melted.pivot_table(
    index=["Year", "Attribute"],
    columns="Year_1",
    values="Value",
    aggfunc='first'
).reset_index()

    # Flatten column names after pivot
df_pivoted.columns.name = None

    # Calculate Rate = Investment Earnings / (Start Valuation + Contributions - Withdrawals)
denominator = df_pivoted['Start Valuation'] + df_pivoted['Contributions'] - df_pivoted['Withdrawals']
denominator_cleaned = denominator.replace(0, 1)

df_pivoted['Category'] = df_pivoted['Year'].apply(
    lambda x: "Income" if ("income" in str(x).lower() or "pension" in str(x).lower()) else "Asset"
)

asset_rate = (
    df_pivoted['Investment Earnings']
    .div(denominator_cleaned)
    .replace([float('inf'), -float('inf')], 0)  # Replace inf resulting from division by zero
    .fillna(0)  # Replace NaNs (from 0/0) with 0
    .round(4)
)

# Load inflation rate from Excel sheet "Inflation" cell A2
inflation_df = pd.read_excel(excel_file, sheet_name="Inflation", header=None)
raw_inflation = inflation_df.iloc[1, 0]
if isinstance(raw_inflation, str):
    raw_inflation = raw_inflation.replace('%', '').strip()
    inflation_rate = float(raw_inflation) / 100.0
else:
    inflation_rate = float(raw_inflation)
    if inflation_rate > 1:
        inflation_rate = inflation_rate / 100.0

df_pivoted['Rate'] = np.where(
    df_pivoted['Category'] == 'Asset',
    asset_rate,
    inflation_rate
)

    # Step 10: Add Rate of Return column - handle NaN values
df_pivoted['Rate of Return'] = df_pivoted['Rate'].fillna(0)


    # Step 11: Rename columns
df_pivoted = df_pivoted.rename(columns={
    "Year": "Investment Name",
    "Attribute": "Year"
})

    # Step 12: Change data types
df_pivoted['Year'] = df_pivoted['Year'].astype('int64')
df_pivoted['Rate of Return'] = pd.to_numeric(df_pivoted['Rate of Return'], errors='coerce')

    # Step 13: Calculate PV at each row level


    #def pv_excel(rate, nper, pmt, fv=0, when=0):
    #Replicates Excel's PV function.
    #rate: rate of return per period
    #nper: number of periods
    #pmt: payment per period (usually withdrawal here)
    #fv: future value (default 0)
    #when: payment timing, 0 = end of period, 1 = beginning
    #return -npf.pv(rate, nper, pmt, fv, when)


def calculate_pv_per_row(row, df_full):
    investment_name = row['Investment Name']
    current_year = row['Year']
    withdrawal_amount = row['Withdrawals'] # Withdrawal for the current year

    # Initialize the value to be discounted - starting with the withdrawal amount in its year.
    # This will be the 'fv' for the first PV calculation (discounting back one year).
    value_to_discount = withdrawal_amount

    # Filter historical rates for the same investment, up to the current year
    # Sort by Year in descending order to apply rates backward
    df_historical_rates = df_full[
        (df_full['Investment Name'] == investment_name) &
        (df_full['Year'] < current_year)
    ].sort_values(by='Year', ascending=False) # Start from the most recent year

    # Iterate through the rates, starting from the withdrawal year and going backward.
    for _, history_row in df_historical_rates.iterrows():
        rate = history_row['Rate of Return']
        year = history_row['Year']

        # Each iteration represents discounting for one period (year).
        nper = 1

        # Calculate PV. The 'value_to_discount' from the *next* (later) year's perspective
        # becomes the 'fv' for the current year's PV calculation.
        # PMT is 0 as we're treating the withdrawal as a single future value being discounted.
        value_to_discount = npf.pv(rate, nper, 0, value_to_discount)

    return abs(value_to_discount) # Return positive PV

# Applying the function row-wise and creating new 'Present Value' column
df_pivoted['Present Value'] = df_pivoted.apply(calculate_pv_per_row, axis=1, args=(df_pivoted,))

def calculate_pv_at_retirement(row, df_full, retirement_year):
    investment_name = row['Investment Name']
    current_year = row['Year']
    withdrawal_amount = row['Withdrawals']
    # Only discount withdrawals for years >= retirement_year back to the retirement year
    if (retirement_year is not None) and (current_year >= retirement_year):
        value_to_discount = withdrawal_amount
        # Get rates from (retirement_year) up to (current_year - 1), sort descending
        df_rates = df_full[
            (df_full['Investment Name'] == investment_name) &
            (df_full['Year'] >= retirement_year) &
            (df_full['Year'] < current_year)
        ].sort_values(by='Year', ascending=False)
        for _, history_row in df_rates.iterrows():
            rate = history_row['Rate of Return']
            value_to_discount = npf.pv(rate, 1, 0, value_to_discount)
        return abs(value_to_discount)
    else:
        return 0

df_pivoted['PV at retirement'] = df_pivoted.apply(
    lambda row: calculate_pv_at_retirement(row, df_pivoted, retirement_year),
    axis=1
)

df_pivoted['Retirement Year'] = retirement_year

    # Step 14: Select only required columns
final_df = df_pivoted[["Investment Name", "Year", "Withdrawals", "Rate of Return", "Present Value","PV at retirement","Retirement Year"]].copy()


if retirement_rows.empty:
    print("The retirement_rows DataFrame is blank and has no data.")
else:
    print("The retirement_rows DataFrame has data.")


class GoalAllocationSystem:
    def __init__(self, goals_df, investments_df, priority_investments_df):
        """
        Initialize the allocation system with the three input files
        """
        self.goals_df = goals_df.copy()
        self.investments_df = investments_df.copy()
        self.priority_investments_df = priority_investments_df.copy()

        # Clean column names
        self.goals_df.columns = self.goals_df.columns.str.strip()
        self.investments_df.columns = self.investments_df.columns.str.strip()
        self.priority_investments_df.columns = self.priority_investments_df.columns.str.strip()

        self.allocation_results = []
        self.detailed_allocations = []

    def allocate_investment_to_goal(self, investment_amounts, goal_amount, level_name, goal_name, year):
        """
        Core allocation logic as per the specified algorithm
        """
        if goal_amount <= 0 or not investment_amounts:
            return investment_amounts, goal_amount, []

        allocations = []
        remaining_investments = investment_amounts.copy()
        remaining_goal = goal_amount

        while remaining_goal > 0 and remaining_investments:
            # Calculate average investment amount required
            avg_required = remaining_goal / len(remaining_investments)

            # Find investments less than average
            small_investments = [(inv_name, amount) for inv_name, amount in remaining_investments.items()
                               if amount < avg_required]

            if small_investments:
                # Allocate small investments first
                for inv_name, amount in small_investments:
                    allocated = min(amount, remaining_goal)
                    allocations.append({
                        'Level': level_name,
                        'Year': year,
                        'Investment': inv_name,
                        'Goal': goal_name,
                        'Allocated': allocated,
                        'Investment_Balance': amount - allocated
                    })
                    remaining_goal -= allocated
                    del remaining_investments[inv_name]

                    if remaining_goal <= 0:
                        break
            else:
                # All investments are >= average, allocate proportionally
                if remaining_investments:
                    for inv_name, amount in remaining_investments.items():
                        allocated = min(avg_required, amount, remaining_goal)
                        allocations.append({
                            'Level': level_name,
                            'Year': year,
                            'Investment': inv_name,
                            'Goal': goal_name,
                            'Allocated': allocated,
                            'Investment_Balance': amount - allocated
                        })
                        remaining_investments[inv_name] -= allocated
                        remaining_goal -= allocated

                        if remaining_goal <= 0:
                            break

                    # Remove fully allocated investments
                    remaining_investments = {k: v for k, v in remaining_investments.items() if v > 0}
                break

        return remaining_investments, remaining_goal, allocations

    def process_year_allocation(self, year):
        """
        Process allocation for a specific year following the 8-level system
        """
        # Get goals and investments for this year
        year_goals = self.goals_df[self.goals_df['Year'] == year].copy()
        year_investments = self.investments_df[self.investments_df['Year'] == year].copy()

        if year_goals.empty or year_investments.empty:
            return

        # Separate income and asset investments
        income_investments = year_investments[year_investments['Category'] == 'Income'].copy()
        asset_investments = year_investments[year_investments['Category'] == 'Asset'].copy()

        # Create investment dictionaries
        income_inv_dict = dict(zip(income_investments['Investments Name'], income_investments['Amount Withdrawn']))
        asset_inv_dict = dict(zip(asset_investments['Investments Name'], asset_investments['Amount Withdrawn']))

        # Create goal dictionaries
        goal_dict = dict(zip(year_goals['Goal name'], year_goals['Amount']))

        # Track balances through levels
        balance_goals = goal_dict.copy()
        balance_income_inv = income_inv_dict.copy()
        balance_asset_inv = asset_inv_dict.copy()

        # LEVEL 1: Priority Goal 1 with Income Investments
        #print(f"\n=== LEVEL 1 - Year {year} ===")
        for _, row in self.priority_investments_df.iterrows():
            inv_name = row['Investments Name']
            priority_goal_1 = row['Priority Goal 1']

            # Skip if Priority Goal 1 is blank/empty/NaN
            if (pd.isna(priority_goal_1) or priority_goal_1 == '' or
                priority_goal_1 == 'Fund all other goals'):
                continue

            if (inv_name in balance_income_inv and
                priority_goal_1 in balance_goals):

                inv_amount = {inv_name: balance_income_inv[inv_name]}
                goal_amount = balance_goals[priority_goal_1]

                remaining_inv, remaining_goal, allocations = self.allocate_investment_to_goal(
                    inv_amount, goal_amount, 'Level 1', priority_goal_1, year
                )

                self.detailed_allocations.extend(allocations)
                balance_goals[priority_goal_1] = remaining_goal

                if remaining_inv:
                    balance_income_inv[inv_name] = list(remaining_inv.values())[0]
                else:
                    del balance_income_inv[inv_name]

        # LEVEL 2: Balance Priority Goal 1 with Asset Investments
        #print(f"\n=== LEVEL 2 - Year {year} ===")
        for _, row in self.priority_investments_df.iterrows():
            inv_name = row['Investments Name']
            priority_goal_1 = row['Priority Goal 1']

            # Skip if Priority Goal 1 is blank/empty/NaN
            if (pd.isna(priority_goal_1) or priority_goal_1 == '' or
                priority_goal_1 == 'Fund all other goals'):
                continue

            if (inv_name in balance_asset_inv and
                priority_goal_1 in balance_goals and
                balance_goals[priority_goal_1] > 0):

                inv_amount = {inv_name: balance_asset_inv[inv_name]}
                goal_amount = balance_goals[priority_goal_1]

                remaining_inv, remaining_goal, allocations = self.allocate_investment_to_goal(
                    inv_amount, goal_amount, 'Level 2', priority_goal_1, year
                )

                self.detailed_allocations.extend(allocations)
                balance_goals[priority_goal_1] = remaining_goal

                if remaining_inv:
                    balance_asset_inv[inv_name] = list(remaining_inv.values())[0]
                else:
                    del balance_asset_inv[inv_name]

        # LEVEL 3: Priority Goal 2 with Balance Income Investments
        #print(f"\n=== LEVEL 3 - Year {year} ===")
        for _, row in self.priority_investments_df.iterrows():
            inv_name = row['Investments Name']
            priority_goal_2 = row['Priority Goal 2'] if 'Priority Goal 2' in row else None

            # Skip if Priority Goal 2 is blank/empty/NaN
            if (pd.isna(priority_goal_2) or priority_goal_2 == '' or
                priority_goal_2 == 'Fund all other goals'):
                continue

            if (inv_name in balance_income_inv and
                priority_goal_2 in balance_goals):

                inv_amount = {inv_name: balance_income_inv[inv_name]}
                goal_amount = balance_goals[priority_goal_2]

                remaining_inv, remaining_goal, allocations = self.allocate_investment_to_goal(
                    inv_amount, goal_amount, 'Level 3', priority_goal_2, year
                )

                self.detailed_allocations.extend(allocations)
                balance_goals[priority_goal_2] = remaining_goal

                if remaining_inv:
                    balance_income_inv[inv_name] = list(remaining_inv.values())[0]
                else:
                    del balance_income_inv[inv_name]

        # LEVEL 4: Balance Priority Goal 2 with Balance Asset Investments
        #print(f"\n=== LEVEL 4 - Year {year} ===")
        for _, row in self.priority_investments_df.iterrows():
            inv_name = row['Investments Name']
            priority_goal_2 = row['Priority Goal 2'] if 'Priority Goal 2' in row else None

            # Skip if Priority Goal 2 is blank/empty/NaN
            if (pd.isna(priority_goal_2) or priority_goal_2 == '' or
                priority_goal_2 == 'Fund all other goals'):
                continue

            if (inv_name in balance_asset_inv and
                priority_goal_2 in balance_goals and
                balance_goals[priority_goal_2] > 0):

                inv_amount = {inv_name: balance_asset_inv[inv_name]}
                goal_amount = balance_goals[priority_goal_2]

                remaining_inv, remaining_goal, allocations = self.allocate_investment_to_goal(
                    inv_amount, goal_amount, 'Level 4', priority_goal_2, year
                )

                self.detailed_allocations.extend(allocations)
                balance_goals[priority_goal_2] = remaining_goal

                if remaining_inv:
                    balance_asset_inv[inv_name] = list(remaining_inv.values())[0]
                else:
                    del balance_asset_inv[inv_name]

        # Get sorted goals by priority for levels 5-8
        sorted_goals = year_goals.sort_values('Priority')['Goal name'].tolist()

        # LEVEL 5: Balance Income Investments (mapped to Priority Goal 1 & 2) to Goals in Priority Order
        #print(f"\n=== LEVEL 5 - Year {year} ===")
        level5_income_inv = self.get_priority_mapped_investments(balance_income_inv, 'Income')
        if level5_income_inv:
            remaining_goals = self.get_remaining_goals_by_priority(balance_goals, sorted_goals)
            if remaining_goals:
                remaining_inv, allocations = self.allocate_by_priority_order(
                    level5_income_inv, remaining_goals, 'Level 5', year
                )
                self.detailed_allocations.extend(allocations)
                # Update balance investments and goals
                for inv_name, remaining_amount in remaining_inv.items():
                    if remaining_amount > 0:
                        balance_income_inv[inv_name] = remaining_amount
                    else:
                        balance_income_inv.pop(inv_name, None)
                for alloc in allocations:
                    balance_goals[alloc['Goal']] -= alloc['Allocated']

        # LEVEL 6: Balance Asset Investments (mapped to Priority Goal 1 & 2) to Goals in Priority Order
        #print(f"\n=== LEVEL 6 - Year {year} ===")
        level6_asset_inv = self.get_priority_mapped_investments(balance_asset_inv, 'Asset')
        if level6_asset_inv:
            remaining_goals = self.get_remaining_goals_by_priority(balance_goals, sorted_goals)
            if remaining_goals:
                remaining_inv, allocations = self.allocate_by_priority_order(
                    level6_asset_inv, remaining_goals, 'Level 6', year
                )
                self.detailed_allocations.extend(allocations)
                # Update balance investments and goals
                for inv_name, remaining_amount in remaining_inv.items():
                    if remaining_amount > 0:
                        balance_asset_inv[inv_name] = remaining_amount
                    else:
                        balance_asset_inv.pop(inv_name, None)
                for alloc in allocations:
                    balance_goals[alloc['Goal']] -= alloc['Allocated']

        # LEVEL 7: Income Investments (NOT mapped to any priority goal) to Goals in Priority Order
        #print(f"\n=== LEVEL 7 - Year {year} ===")
        level7_income_inv = self.get_non_priority_mapped_investments(balance_income_inv, 'Income')
        if level7_income_inv:
            remaining_goals = self.get_remaining_goals_by_priority(balance_goals, sorted_goals)
            if remaining_goals:
                remaining_inv, allocations = self.allocate_by_priority_order(
                    level7_income_inv, remaining_goals, 'Level 7', year
                )
                self.detailed_allocations.extend(allocations)
                # Update balance investments and goals
                for inv_name, remaining_amount in remaining_inv.items():
                    if remaining_amount > 0:
                        balance_income_inv[inv_name] = remaining_amount
                    else:
                        balance_income_inv.pop(inv_name, None)
                for alloc in allocations:
                    balance_goals[alloc['Goal']] -= alloc['Allocated']

        # LEVEL 8: Asset Investments (NOT mapped to any priority goal) to Goals in Priority Order
        #print(f"\n=== LEVEL 8 - Year {year} ===")
        level8_asset_inv = self.get_non_priority_mapped_investments(balance_asset_inv, 'Asset')
        if level8_asset_inv:
            remaining_goals = self.get_remaining_goals_by_priority(balance_goals, sorted_goals)
            if remaining_goals:
                remaining_inv, allocations = self.allocate_by_priority_order(
                    level8_asset_inv, remaining_goals, 'Level 8', year
                )
                self.detailed_allocations.extend(allocations)
                # Update balance investments and goals
                for inv_name, remaining_amount in remaining_inv.items():
                    if remaining_amount > 0:
                        balance_asset_inv[inv_name] = remaining_amount
                    else:
                        balance_asset_inv.pop(inv_name, None)
                for alloc in allocations:
                    balance_goals[alloc['Goal']] -= alloc['Allocated']

        # Store final unfulfilled goals
        unfulfilled_goals = {k: v for k, v in balance_goals.items() if v > 0}
        if unfulfilled_goals:
            for goal_name, amount in unfulfilled_goals.items():
                self.allocation_results.append({
                    'Year': year,
                    'Goal': goal_name,
                    'Unfulfilled_Amount': amount
                })

    def get_priority_mapped_investments(self, available_investments, category):
        """
        Get investments that are mapped to Priority Goal 1 or Priority Goal 2
        """
        priority_mapped = {}

        for _, row in self.priority_investments_df.iterrows():
            inv_name = row['Investments Name']
            priority_goal_1 = row['Priority Goal 1']
            priority_goal_2 = row['Priority Goal 2'] if 'Priority Goal 2' in row else None

            # Check if investment is available and of correct category
            if inv_name in available_investments:
                # Get investment category from investments_df
                inv_category = self.investments_df[
                    self.investments_df['Investments Name'] == inv_name
                ]['Category'].iloc[0] if not self.investments_df[
                    self.investments_df['Investments Name'] == inv_name
                ].empty else None

                if inv_category == category:
                    # Check if it has priority goal 1 or 2 (not blank and not "Fund all other goals")
                    has_priority_goal_1 = (not pd.isna(priority_goal_1) and
                                          priority_goal_1 != '' and
                                          priority_goal_1 != 'Fund all other goals')

                    has_priority_goal_2 = (priority_goal_2 is not None and
                                          not pd.isna(priority_goal_2) and
                                          priority_goal_2 != '' and
                                          priority_goal_2 != 'Fund all other goals')

                    if has_priority_goal_1 or has_priority_goal_2:
                        priority_mapped[inv_name] = available_investments[inv_name]

        return priority_mapped

    def get_non_priority_mapped_investments(self, available_investments, category):
        """
        Get investments that are NOT mapped to any priority goal (only "Fund all other goals")
        """
        non_priority_mapped = {}

        for _, row in self.priority_investments_df.iterrows():
            inv_name = row['Investments Name']
            priority_goal_1 = row['Priority Goal 1']
            priority_goal_2 = row['Priority Goal 2'] if 'Priority Goal 2' in row else None

            # Check if investment is available and of correct category
            if inv_name in available_investments:
                # Get investment category from investments_df
                inv_category = self.investments_df[
                    self.investments_df['Investments Name'] == inv_name
                ]['Category'].iloc[0] if not self.investments_df[
                    self.investments_df['Investments Name'] == inv_name
                ].empty else None

                if inv_category == category:
                    # Check if it has NO priority goals (both blank or "Fund all other goals")
                    has_priority_goal_1 = (not pd.isna(priority_goal_1) and
                                          priority_goal_1 != '' and
                                          priority_goal_1 != 'Fund all other goals')

                    has_priority_goal_2 = (priority_goal_2 is not None and
                                          not pd.isna(priority_goal_2) and
                                          priority_goal_2 != '' and
                                          priority_goal_2 != 'Fund all other goals')

                    if not has_priority_goal_1 and not has_priority_goal_2:
                        non_priority_mapped[inv_name] = available_investments[inv_name]

        return non_priority_mapped

    def get_remaining_goals_by_priority(self, balance_goals, sorted_goals):
        """
        Get remaining goals (with balance > 0) in priority order
        """
        remaining_goals = []
        for goal_name in sorted_goals:
            if goal_name in balance_goals and balance_goals[goal_name] > 0:
                remaining_goals.append((goal_name, balance_goals[goal_name]))
        return remaining_goals

    def allocate_by_priority_order(self, investments, priority_goals, level_name, year):
        """
        Allocate investments to goals following priority order using core allocation logic
        """
        allocations = []
        remaining_investments = investments.copy()

        # Process goals in priority order (lowest number = highest priority)
        for goal_name, goal_amount in priority_goals:
            if goal_amount > 0 and remaining_investments:
                # Apply core allocation logic for this goal
                remaining_inv, remaining_goal, goal_allocations = self.allocate_investment_to_goal(
                    remaining_investments, goal_amount, level_name, goal_name, year
                )

                allocations.extend(goal_allocations)
                remaining_investments = remaining_inv

                # If goal is fully satisfied, continue to next goal
                if remaining_goal <= 0:
                    continue

        return remaining_investments, allocations

    def run_allocation(self):
        """
        Run the complete allocation process for all years
        """
        years = sorted(self.goals_df['Year'].unique())

        for year in years:
            #print(f"\n{'='*50}")
            #print(f"PROCESSING YEAR {year}")
            #print(f"{'='*50}")
            self.process_year_allocation(year)

        return self.create_detailed_report()

    def create_detailed_report(self):
        """
        Create detailed allocation report
        """
        if not self.detailed_allocations:
            return pd.DataFrame()

        # Create detailed allocation DataFrame
        detailed_df = pd.DataFrame(self.detailed_allocations)

        # Create summary by goal and year
        summary_df = detailed_df.groupby(['Year', 'Goal']).agg({
            'Allocated': 'sum'
        }).reset_index()

        # Create summary by investment and year
        investment_summary_df = detailed_df.groupby(['Year', 'Investment']).agg({
            'Allocated': 'sum'
        }).reset_index()

        return detailed_df, summary_df, investment_summary_df

    def export_to_excel(self, filename='allocation_results.xlsx'):
        """
        Export all results to Excel with multiple sheets
        """
        detailed_df, summary_df, investment_summary_df, = self.create_detailed_report()

        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Detailed allocations
            detailed_df.to_excel(writer, sheet_name='Detailed Allocations', index=False)

            # Goal summary
            summary_df.to_excel(writer, sheet_name='Goal Summary', index=False)

            # Investment summary
            investment_summary_df.to_excel(writer, sheet_name='Investment Summary', index=False)

            # Unfulfilled goals
            unfulfilled_df = pd.DataFrame(self.allocation_results, columns=["Year","Goal","Unfulfilled_Amount"])
            unfulfilled_df.to_excel(writer, sheet_name='Unfulfilled Goals', index=False)

            # Input Files used for allocation
            df1_final.to_excel(writer, sheet_name='Goals', index=False)
            df3_final.to_excel(writer, sheet_name='Investments', index=False)
            df4.to_excel(writer, sheet_name='Priority Investments', index=False)

            # Withdrawal file with PV
            final_df.to_excel(writer, sheet_name='Withdrawal_PV', index=False)

        print(f"\nResults exported to {filename}")
        return filename

# Example usage
if __name__ == "__main__":
    # Initialize the system
    allocator = GoalAllocationSystem(
    	goals_df=df1_final,
	investments_df=df3_final,
    	priority_investments_df=df4)

    # Run allocation
    detailed_df, summary_df, investment_summary_df = allocator.run_allocation()

    # Export results
    allocator.export_to_excel('allocation_results.xlsx')

    # Display summary
    #print("\n" + "="*60)
    #print("ALLOCATION SUMMARY")
    #print("="*60)
    #print(summary_df.to_string(index=False))

    #print("\n" + "="*60)
    #print("INVESTMENT UTILIZATION SUMMARY")
    #print("="*60)
    #print(investment_summary_df.to_string(index=False))
