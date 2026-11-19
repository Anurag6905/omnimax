-- =====================================================================
-- Omnimax replacement — client data schema (PostgreSQL 16)
-- Source of truth: "2025-10-01_Client Data Gathering Sheet.xlsx"
-- 16 tables: 2 foundation + 11 client data + 3 assumptions. See docs/database-schema.md.
--
-- Conventions
--   * Primary keys: uuid (gen_random_uuid()).
--   * Money: numeric(18,2) in INR. Never float.
--   * Rates: numeric(7,4) stored as percent (7.5 = 7.5%).
--   * Dropdown lists from the sheet are text + CHECK (easy to extend).
--   * Derived values in the sheet (current age, annual = monthly x 12,
--     section totals) are NOT stored; they are computed.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FOUNDATION
-- ---------------------------------------------------------------------

-- 1. users — advisers, operations and admin staff who log in
CREATE TABLE users (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name      text        NOT NULL,
    email          text        NOT NULL UNIQUE,
    password_hash  text        NOT NULL,
    role           text        NOT NULL CHECK (role IN ('adviser','operations','admin')),
    is_active      boolean     NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. clients — one row per household (one filled-in data sheet)
CREATE TABLE clients (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_code        text        NOT NULL UNIQUE,          -- e.g. CL-0001
    household_name     text        NOT NULL,                 -- e.g. "Sharma Family"
    adviser_id         uuid        REFERENCES users(id),
    status             text        NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('prospect','active','inactive')),
    data_sheet_date    date,                                 -- date the sheet was filled
    remarks            text,                                 -- Personal Details "Remark"
    created_by         uuid        REFERENCES users(id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_adviser ON clients(adviser_id);

-- ---------------------------------------------------------------------
-- PERSONAL DETAILS sheet
-- ---------------------------------------------------------------------

-- 3. family_members — "Tell us about you and your family"
--    + Insurance sheet "Health Status" block (tobacco, health history)
CREATE TABLE family_members (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id              uuid    NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    is_primary             boolean NOT NULL DEFAULT false,   -- the main client
    full_name              text    NOT NULL,
    relationship           text    NOT NULL,                 -- free text in sheet (Self, Spouse, Son…)
    occupation             text,
    date_of_birth          date,
    retirement_age         smallint CHECK (retirement_age BETWEEN 30 AND 100),
    life_expectancy        smallint NOT NULL DEFAULT 85 CHECK (life_expectancy BETWEEN 40 AND 120),
    financially_dependent  boolean,
    health_status          text,
    tobacco_user           boolean,                          -- Insurance sheet: Tobacco (Y/N)
    health_history         text,                             -- Insurance sheet
    health_remark          text,                             -- Insurance sheet
    pan_number             text CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
    mobile                 text,
    email                  text,
    residence_status       text CHECK (residence_status IN ('Resident Indian','NRI')),
    company_designation    text,
    sort_order             smallint NOT NULL DEFAULT 0,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_family_client ON family_members(client_id);
CREATE UNIQUE INDEX uq_family_one_primary ON family_members(client_id) WHERE is_primary;

-- 4. incomes — "Inflow - Income (Post Tax)"
CREATE TABLE incomes (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    member_id      uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    income_type    text NOT NULL CHECK (income_type IN
                     ('Salary (take home)','Bonus','Business (net profit)','Rental Income')),
    frequency      text NOT NULL CHECK (frequency IN ('Monthly','Half-Yearly','Annually')),
    amount         numeric(18,2) NOT NULL CHECK (amount >= 0),   -- amount per frequency period
    annual_growth_pct numeric(7,4),                               -- project plan: yearly growth (not in sheet)
    start_year     smallint,                                      -- NULL = already earning
    end_rule       text CHECK (end_rule IN ('retirement','year','lifetime')), -- 'retirement' follows the earner's retirement age
    end_year       smallint,                                      -- used when end_rule = 'year'
    CHECK (end_rule IS DISTINCT FROM 'year' OR end_year IS NOT NULL),
    remark         text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_incomes_client ON incomes(client_id);

-- 5. expense_categories — the 17 fixed lines of "Outflow - Expenses" (seeded)
CREATE TABLE expense_categories (
    id          smallint PRIMARY KEY,
    group_name  text NOT NULL CHECK (group_name IN ('Household','Lifestyle','Misc')),
    name        text NOT NULL UNIQUE,
    sort_order  smallint NOT NULL
);

-- 6. expenses — one row per client per category actually filled in
CREATE TABLE expenses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid     NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    category_id     smallint NOT NULL REFERENCES expense_categories(id),
    monthly_amount  numeric(18,2) NOT NULL CHECK (monthly_amount >= 0),
    remark          text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (client_id, category_id)
);

-- ---------------------------------------------------------------------
-- GOALS sheet
-- ---------------------------------------------------------------------

-- 7. goals — all six goal blocks in one table, keyed by goal_type
CREATE TABLE goals (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id                uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    member_id                uuid REFERENCES family_members(id) ON DELETE SET NULL, -- "who is this for"
    goal_type                text NOT NULL CHECK (goal_type IN
                               ('retirement','education','marriage','vacation','house','car','other')),
    name                     text NOT NULL,                  -- e.g. "Aarav – Engineering", "Dream House"
    priority_level           text CHECK (priority_level IN ('High','Medium','Low')), -- as in sheet
    priority_rank            smallint,                       -- 1 = funded first (engine ordering)
    cost_today               numeric(18,2),                  -- today's value (per year for education/vacation)
    -- timing (use the columns that apply to the goal type)
    start_age                smallint,                       -- education start age / marriage age
    start_year               smallint,                       -- vacation start / house-car purchase / other
    end_year                 smallint,                       -- vacation end year
    tenure_years             smallint,                       -- education course tenure (sheet default 3)
    frequency_years          smallint,                       -- vacation: every N years
    -- retirement only
    current_monthly_expenses numeric(18,2),
    -- house / car only
    loan_amount              numeric(18,2),
    -- other goals
    is_wanted                boolean,                        -- "Yes / No"
    time_frame               text,                           -- free text in sheet
    -- assumptions hook (values set in Phase 1B assumptions screens)
    inflation_pct            numeric(7,4),                   -- goal-specific override; NULL = firm default
    remark                   text,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_client ON goals(client_id);

-- ---------------------------------------------------------------------
-- ASSETS sheet
-- ---------------------------------------------------------------------

-- 8. assets — all 9 asset sections in one table, keyed by category.
--    One table keeps "investment -> goal" mapping and net worth simple.
CREATE TABLE assets (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id                uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    owner_member_id          uuid REFERENCES family_members(id) ON DELETE SET NULL,
    category                 text NOT NULL CHECK (category IN (
                               'real_estate',      -- Real Estate Assets
                               'cash_bank',        -- Cash & Savings Bank Account
                               'fixed_income',     -- FD / NBFC FD / Bonds / Debentures / POMIS / KVP / SCSS / NSC
                               'small_savings',    -- PPF / RD / NPS
                               'retirement',       -- EPF / Superannuation / Gratuity
                               'gold_silver',      -- Gold / Silver (excl. self-use jewellery)
                               'miscellaneous',    -- Miscellaneous Assets
                               'mutual_fund',      -- Mutual Funds & SIP
                               'equity'            -- Equity Stocks / PMS
                             )),
    sub_type                 text,      -- property type / asset type / FD type / account type
    name                     text,      -- scheme name, script, or a label
    institution              text,      -- bank / institute / depositor
    location                 text,      -- real estate: city / state
    asset_class              text,      -- MF "ASSETCLASS"; drives return assumptions
    invested_amount          numeric(18,2),   -- purchase value / amount invested / principal
    current_value            numeric(18,2),   -- market value / current value / balance
    value_as_of              date,            -- EPF "balance as on"
    start_date               date,            -- commencement / purchase date (RE: purchase year → Jan 1)
    maturity_date            date,
    maturity_value           numeric(18,2),
    interest_rate_pct        numeric(7,4),    -- FD coupon rate
    compounding              text CHECK (compounding IN ('Monthly','Quarterly','Half-Yearly','Annually','Simple','Cumulative')),
    expected_growth_pct      numeric(7,4),    -- miscellaneous assets
    monthly_contribution     numeric(18,2),   -- SIP / PPF-RD-NPS contribution / EPF employee
    employer_monthly_contribution numeric(18,2), -- EPF employer
    yearly_contribution      numeric(18,2),   -- gold / misc yearly investment
    annual_step_up_pct       numeric(7,4),    -- SIP yearly step-up (project requirement; not in sheet)
    contribution_end_rule    text CHECK (contribution_end_rule IN ('retirement','year')), -- when SIP / contributions stop
    contribution_end_year    smallint,        -- used when contribution_end_rule = 'year'
    available_from_year      smallint,        -- project plan: first year it can fund goals (NULL = now)
    quantity                 numeric(18,4),   -- equity: quantity
    buy_price                numeric(18,4),   -- equity: buy price per unit
    remark                   text,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_assets_client ON assets(client_id);

-- 9. goal_funding_links — "Priority Goal 1/2/3" per investment
--    (Input_Allocations.py, Investments sheet) and the Real Estate "Goal" column.
--    A source is either an asset or an income stream (the script treats
--    income/pension as a funding source too). No row = "Fund all other goals".
CREATE TABLE goal_funding_links (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    goal_id     uuid NOT NULL REFERENCES goals(id)   ON DELETE CASCADE,
    asset_id    uuid REFERENCES assets(id)   ON DELETE CASCADE,
    income_id   uuid REFERENCES incomes(id)  ON DELETE CASCADE,
    rank        smallint NOT NULL CHECK (rank BETWEEN 1 AND 3),   -- Priority Goal 1, 2 or 3
    created_at  timestamptz NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(asset_id, income_id) = 1)
);
CREATE UNIQUE INDEX uq_link_asset_rank  ON goal_funding_links(asset_id, rank)  WHERE asset_id  IS NOT NULL;
CREATE UNIQUE INDEX uq_link_income_rank ON goal_funding_links(income_id, rank) WHERE income_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- LIABILITIES sheet
-- ---------------------------------------------------------------------

-- 10. liabilities — loans
CREATE TABLE liabilities (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id              uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    owner_member_id        uuid REFERENCES family_members(id) ON DELETE SET NULL,
    loan_type              text NOT NULL CHECK (loan_type IN ('Home Loan','Education Loan','Personal Loan',
                             'Loan against Policy / MF / Shares','Vehicle Loan')),
    principal_outstanding  numeric(18,2) NOT NULL CHECK (principal_outstanding >= 0),
    emi_amount             numeric(18,2),
    emi_end_month          date,            -- "EMI continues till (mmm-yyyy)" → first of month
    interest_rate_pct      numeric(7,4),
    lender                 text,
    remark                 text,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_liabilities_client ON liabilities(client_id);

-- 11. credit_card_profiles — the 5 credit card questions (one per client)
CREATE TABLE credit_card_profiles (
    client_id            uuid PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
    card_count           smallint,
    outstanding_amount   numeric(18,2),
    payment_behaviour    text CHECK (payment_behaviour IN ('Full','Partial')),
    yearly_usage         numeric(18,2),
    years_using          smallint,
    updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- INSURANCE sheet
-- ---------------------------------------------------------------------

-- 12. life_insurance_policies
CREATE TABLE life_insurance_policies (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    insured_member_id   uuid REFERENCES family_members(id) ON DELETE SET NULL,
    policy_name         text NOT NULL,
    policy_number       text,
    commencement_date   date,
    sum_assured         numeric(18,2),
    premium_amount      numeric(18,2),
    premium_frequency   text CHECK (premium_frequency IN ('Yearly','Half-Yearly','Quarterly','Monthly','Single')),
    policy_term_years   smallint,
    ppt_years           smallint,             -- premium paying term
    surrender_value     numeric(18,2),
    maturity_value      numeric(18,2),
    riders              text,
    nominee_name        text,
    status              text CHECK (status IN ('Active','Lapsed')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_life_client ON life_insurance_policies(client_id);

-- 13. general_insurance_policies — Health (HP) / Personal Accident (PA) / Critical Illness (CI)
CREATE TABLE general_insurance_policies (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    insured_member_id   uuid REFERENCES family_members(id) ON DELETE SET NULL, -- floater: main insured
    policy_name         text NOT NULL,
    cover_type          text CHECK (cover_type IN ('HP','PA','CI')),
    policy_type         text CHECK (policy_type IN ('Individual','Floater','Group')),
    commencement_date   date,
    sum_assured         numeric(18,2),
    annual_premium      numeric(18,2),
    tenure_years        smallint,
    renewal_date        date,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_general_client ON general_insurance_policies(client_id);

-- ---------------------------------------------------------------------
-- ASSUMPTIONS (project plan: returns by asset class and period,
-- inflation by goal type, firm-wide defaults)
-- ---------------------------------------------------------------------

-- 14. assumption_sets — the firm default (client_id NULL) or one client's plan.
--     A client's set only stores overrides; anything missing falls back to the firm default.
CREATE TABLE assumption_sets (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id    uuid UNIQUE REFERENCES clients(id) ON DELETE CASCADE,  -- NULL = firm default
    updated_by   uuid REFERENCES users(id),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_one_firm_default ON assumption_sets ((client_id IS NULL)) WHERE client_id IS NULL;

-- 15. return_assumptions — expected return for an asset class over a period.
--     Periods run in order; each ends at a year, at the main client's retirement, or never (last period).
CREATE TABLE return_assumptions (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id       uuid NOT NULL REFERENCES assumption_sets(id) ON DELETE CASCADE,
    asset_class  text NOT NULL,
    seq          smallint NOT NULL,                      -- 1, 2, 3… in time order
    rate_pct     numeric(7,4) NOT NULL,
    end_rule     text NOT NULL CHECK (end_rule IN ('year','retirement','open')),
    end_year     smallint,
    CHECK (end_rule <> 'year' OR end_year IS NOT NULL),
    UNIQUE (set_id, asset_class, seq)
);

-- 16. inflation_assumptions — inflation per goal type (plus 'expenses' for household spending).
CREATE TABLE inflation_assumptions (
    set_id       uuid NOT NULL REFERENCES assumption_sets(id) ON DELETE CASCADE,
    goal_type    text NOT NULL CHECK (goal_type IN ('expenses','retirement','education','marriage','vacation','house','car','other')),
    rate_pct     numeric(7,4) NOT NULL,
    PRIMARY KEY (set_id, goal_type)
);

-- ---------------------------------------------------------------------
-- SEED: expense categories exactly as in the sheet
-- ---------------------------------------------------------------------
INSERT INTO expense_categories (id, group_name, name, sort_order) VALUES
 (1,  'Household', 'Food, Grocery, Gas Etc.', 1),
 (2,  'Household', 'Mobile / Telephone / Internet', 2),
 (3,  'Household', 'Electricity / Water / Labour / AMCs / Security', 3),
 (4,  'Household', 'House Help / Maid', 4),
 (5,  'Household', 'House Rent / Maintenance / Repair', 5),
 (6,  'Household', 'Household Appliances', 6),
 (7,  'Household', 'Conveyance, Fuel & Maintenance', 7),
 (8,  'Household', 'Vehicle Insurance & Maintenance', 8),
 (9,  'Household', 'Property Tax', 9),
 (10, 'Household', 'Medicines / Doctor / Healthcare / Preventive Checkup', 10),
 (11, 'Lifestyle', 'Clothes & Accessories', 11),
 (12, 'Lifestyle', 'Shopping, Gifts, Whitegoods, Gadgets', 12),
 (13, 'Lifestyle', 'Dining / Movies / Sports', 13),
 (14, 'Lifestyle', 'Personal Care / Others', 14),
 (15, 'Misc',      'Travel & Annual Vacations', 15),
 (16, 'Misc',      'Children''s Schooling/College Expenses', 16),
 (17, 'Misc',      'Contribution to Parents, Siblings etc', 17),
 (18, 'Misc',      'Donation / Charity', 18);
