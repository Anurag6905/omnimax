"use client";

import type { Asset, AssetCategory } from "@omnimax/shared";
import { RecordSection, GoalLinksCell, type CellContext, type ColumnDef, type Draft, type FieldDef } from "@/components/records/record-section";
import {
  ASSET_CLASS_SUGGESTIONS, ASSET_SECTIONS, CASH_TYPE_SUGGESTIONS, COMPOUNDING_OPTIONS, FIXED_INCOME_TYPES,
  GOLD_TYPES, PROPERTY_TYPES, RETIREMENT_ACCOUNT_TYPES, SMALL_SAVINGS_TYPES,
} from "@/data/sheet-lists";
import { useClientRecords } from "@/lib/store";
import { formatDate, formatINR, formatPct, yearAtAge } from "@/lib/format";
import type { TabProps } from "./types";

/**
 * Assets sheet: nine sections, each with the sheet's own columns.
 * All nine save to the one `assets` table (db/schema.sql), told apart by category.
 */

const owner = (label: string): FieldDef => ({ key: "ownerMemberId", label, type: "member", required: true });
const reserved: FieldDef = { key: "goals", label: "Reserved for goals", type: "goals" };
const remark: FieldDef = { key: "remark", label: "Remark", type: "text", wide: true };

const sum = (pick: (a: Asset) => number | undefined) => (rows: Asset[]) => rows.reduce((s, a) => s + (pick(a) ?? 0), 0);
const money = (pick: (a: Asset) => number | undefined) => (a: Asset) => formatINR(pick(a));
const ownerCol = (label: string): ColumnDef<Asset> => ({ label, cell: (a, c) => c.member(a.ownerMemberId) });
const reservedCol: ColumnDef<Asset> = {
  label: "Reserved for",
  cell: (a, c) => (
    <>
      <GoalLinksCell links={c.links(a.id)} goal={c.goal} />
      {a.availableFromYear ? <span className="block text-xs text-muted">Usable from {a.availableFromYear}</span> : null}
    </>
  ),
};

/** Project plan: the year an asset can first fund goals (e.g. PPF lock-in). */
const usableFrom: FieldDef = { key: "availableFromYear", label: "Can be used for goals from", type: "year", hint: "Leave blank if usable now, e.g. 2031 for a PPF lock-in" };

/** Project plan: SIPs and contributions stop at retirement, and move with it. */
const hasContribution = (d: Draft) => !!(d.monthlyContribution || d.yearlyContribution || d.employerMonthlyContribution);
const contributionEnd: FieldDef[] = [
  {
    key: "contributionEndRule", label: "Contributions stop", type: "select", required: true, showIf: hasContribution,
    options: [{ value: "retirement", label: "At the owner's retirement" }, { value: "year", label: "In a set year" }],
    hint: "\"At retirement\" moves automatically if the retirement age changes",
  },
  { key: "contributionEndYear", label: "Last year of contributions", type: "year", required: true, showIf: (d) => hasContribution(d) && d.contributionEndRule === "year" },
];
const HAS_CONTRIBUTIONS: AssetCategory[] = ["small_savings", "retirement", "gold_silver", "miscellaneous", "mutual_fund"];

/** "till retirement, 2040" / "till 2031" under a contribution amount. */
function stops(a: Asset, c: CellContext): React.ReactNode {
  if (!a.monthlyContribution && !a.yearlyContribution && !a.employerMonthlyContribution) return null;
  if (a.contributionEndRule === "year") return <span className="block text-xs text-muted">till {a.contributionEndYear}</span>;
  if (a.contributionEndRule === "retirement") {
    const p = c.person(a.ownerMemberId);
    const y = yearAtAge(p?.dateOfBirth, p?.retirementAge);
    return <span className="block text-xs text-muted">till retirement{y ? `, ${y}` : ""}</span>;
  }
  return null;
}

/** "01-Apr-2015 – 01-Apr-2031", or just the start when there's no maturity date. */
function span(start?: string, end?: string): string {
  if (!start && !end) return "–";
  if (!end) return `From ${formatDate(start)}`;
  if (!start) return `Till ${formatDate(end)}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function datesInOrder(d: Draft): Record<string, string> {
  return d.startDate && d.maturityDate && d.maturityDate <= d.startDate ? { maturityDate: "Maturity date must be after the start date." } : {};
}

const SECTIONS: Record<AssetCategory, { fields: FieldDef[]; columns: Array<ColumnDef<Asset>>; validate?: (d: Draft) => Record<string, string> }> = {
  real_estate: {
    fields: [
      owner("Owner"),
      { key: "subType", label: "Property type", type: "select", options: PROPERTY_TYPES, required: true },
      { key: "location", label: "City / state", type: "text" },
      { key: "startDate", label: "Purchase year", type: "yeardate" },
      { key: "investedAmount", label: "Purchase value", type: "money" },
      { key: "currentValue", label: "Market value", type: "money", required: true },
      reserved,
    ],
    columns: [
      ownerCol("Owner"),
      { label: "Property", cell: (a) => <>{a.subType}<span className="block text-xs text-muted">{a.location}</span></> },
      { label: "Purchase year", align: "right", cell: (a) => a.startDate?.slice(0, 4) ?? "–" },
      { label: "Purchase value", align: "right", cell: money((a) => a.investedAmount) },
      { label: "Market value", align: "right", cell: money((a) => a.currentValue), total: sum((a) => a.currentValue) },
      reservedCol,
    ],
  },
  cash_bank: {
    fields: [
      owner("Owner"),
      { key: "subType", label: "Asset type", type: "text", suggestions: CASH_TYPE_SUGGESTIONS, required: true },
      { key: "institution", label: "Bank", type: "text" },
      { key: "currentValue", label: "Current value", type: "money", required: true },
      remark,
      reserved,
    ],
    columns: [
      ownerCol("Owner"),
      { label: "Type", cell: (a) => <>{a.subType}<span className="block text-xs text-muted">{a.institution}</span></> },
      { label: "Current value", align: "right", cell: money((a) => a.currentValue), total: sum((a) => a.currentValue) },
      { label: "Remark", cell: (a) => a.remark ?? "–" },
      reservedCol,
    ],
  },
  fixed_income: {
    fields: [
      owner("Investor"),
      { key: "subType", label: "Type", type: "select", options: FIXED_INCOME_TYPES, required: true },
      { key: "institution", label: "Bank, institution or depositor", type: "text", wide: true },
      { key: "investedAmount", label: "Amount invested", type: "money", required: true },
      { key: "maturityValue", label: "Maturity value", type: "money" },
      { key: "startDate", label: "Start date", type: "date" },
      { key: "maturityDate", label: "Maturity date", type: "date" },
      { key: "interestRatePct", label: "Interest / coupon rate", type: "percent" },
      { key: "compounding", label: "Interest compounding", type: "select", options: COMPOUNDING_OPTIONS },
      reserved,
    ],
    columns: [
      ownerCol("Investor"),
      { label: "Type", cell: (a) => <>{a.subType}<span className="block text-xs text-muted">{a.institution}</span></> },
      { label: "Invested", align: "right", cell: money((a) => a.investedAmount), total: sum((a) => a.investedAmount) },
      { label: "Rate", align: "right", cell: (a) => <>{formatPct(a.interestRatePct)}<span className="block text-xs text-muted">{a.compounding}</span></> },
      { label: "Start – maturity", cell: (a) => span(a.startDate, a.maturityDate) },
      { label: "Maturity value", align: "right", cell: money((a) => a.maturityValue), total: sum((a) => a.maturityValue) },
      reservedCol,
    ],
    validate: datesInOrder,
  },
  small_savings: {
    fields: [
      owner("Investor"),
      { key: "subType", label: "Account type", type: "select", options: SMALL_SAVINGS_TYPES, required: true },
      { key: "investedAmount", label: "Investment amount (principal)", type: "money", required: true },
      { key: "monthlyContribution", label: "Contribution per month", type: "money" },
      { key: "startDate", label: "Purchase date", type: "date" },
      { key: "maturityDate", label: "Maturity date", type: "date" },
      { key: "maturityValue", label: "Maturity value", type: "money" },
      reserved,
    ],
    columns: [
      ownerCol("Investor"),
      { label: "Account", cell: (a) => a.subType },
      { label: "Principal", align: "right", cell: money((a) => a.investedAmount), total: sum((a) => a.investedAmount) },
      { label: "Per month", align: "right", cell: (a, c) => <>{formatINR(a.monthlyContribution)}{stops(a, c)}</>, total: sum((a) => a.monthlyContribution) },
      { label: "Start – maturity", cell: (a) => span(a.startDate, a.maturityDate) },
      { label: "Maturity value", align: "right", cell: money((a) => a.maturityValue) },
      reservedCol,
    ],
    validate: datesInOrder,
  },
  retirement: {
    fields: [
      owner("Owner"),
      { key: "subType", label: "Account type", type: "select", options: RETIREMENT_ACCOUNT_TYPES, required: true },
      { key: "currentValue", label: "Current balance", type: "money", required: true },
      { key: "valueAsOf", label: "Balance as on", type: "date" },
      { key: "monthlyContribution", label: "Employee's monthly contribution", type: "money" },
      { key: "employerMonthlyContribution", label: "Employer's monthly contribution", type: "money" },
      remark,
      reserved,
    ],
    columns: [
      ownerCol("Owner"),
      { label: "Account", cell: (a) => a.subType },
      { label: "Balance", align: "right", cell: (a) => <>{formatINR(a.currentValue)}<span className="block text-xs text-muted">as on {formatDate(a.valueAsOf)}</span></>, total: sum((a) => a.currentValue) },
      { label: "Employee / month", align: "right", cell: (a, c) => <>{formatINR(a.monthlyContribution)}{stops(a, c)}</> },
      { label: "Employer / month", align: "right", cell: money((a) => a.employerMonthlyContribution) },
      reservedCol,
    ],
  },
  gold_silver: {
    fields: [
      owner("Investor"),
      { key: "subType", label: "Asset type", type: "select", options: GOLD_TYPES, required: true },
      { key: "investedAmount", label: "Investment amount (principal)", type: "money" },
      { key: "currentValue", label: "Current value", type: "money", required: true },
      { key: "yearlyContribution", label: "Yearly investment amount", type: "money" },
      reserved,
    ],
    columns: [
      ownerCol("Investor"),
      { label: "Type", cell: (a) => a.subType },
      { label: "Principal", align: "right", cell: money((a) => a.investedAmount) },
      { label: "Current value", align: "right", cell: money((a) => a.currentValue), total: sum((a) => a.currentValue) },
      { label: "Yearly investment", align: "right", cell: (a, c) => <>{formatINR(a.yearlyContribution)}{stops(a, c)}</> },
      reservedCol,
    ],
  },
  miscellaneous: {
    fields: [
      owner("Investor"),
      { key: "subType", label: "Asset type", type: "text", required: true, placeholder: "e.g. ESOP, P2P lending" },
      { key: "investedAmount", label: "Investment amount (principal)", type: "money" },
      { key: "currentValue", label: "Current value", type: "money", required: true },
      { key: "yearlyContribution", label: "Yearly investment amount", type: "money" },
      { key: "expectedGrowthPct", label: "Expected growth rate", type: "percent" },
      reserved,
    ],
    columns: [
      ownerCol("Investor"),
      { label: "Type", cell: (a) => a.subType },
      { label: "Principal", align: "right", cell: money((a) => a.investedAmount) },
      { label: "Current value", align: "right", cell: money((a) => a.currentValue), total: sum((a) => a.currentValue) },
      { label: "Yearly investment", align: "right", cell: (a, c) => <>{formatINR(a.yearlyContribution)}{stops(a, c)}</> },
      { label: "Expected growth", align: "right", cell: (a) => formatPct(a.expectedGrowthPct) },
      reservedCol,
    ],
  },
  mutual_fund: {
    fields: [
      owner("Holder"),
      { key: "name", label: "Scheme name", type: "text", required: true, wide: true },
      { key: "assetClass", label: "Asset class", type: "text", suggestions: ASSET_CLASS_SUGGESTIONS, required: true },
      { key: "currentValue", label: "Market value", type: "money", required: true },
      { key: "monthlyContribution", label: "SIP per month", type: "money" },
      { key: "annualStepUpPct", label: "SIP yearly step-up", type: "percent", hint: "Not on the data sheet; needed for SIP projections" },
      reserved,
    ],
    columns: [
      ownerCol("Holder"),
      { label: "Scheme", cell: (a) => <>{a.name}<span className="block text-xs text-muted">{a.assetClass}</span></> },
      { label: "Market value", align: "right", cell: money((a) => a.currentValue), total: sum((a) => a.currentValue) },
      { label: "SIP / month", align: "right", cell: (a, c) => <>{formatINR(a.monthlyContribution)}{a.annualStepUpPct ? <span className="block text-xs text-muted">+{a.annualStepUpPct}% a year</span> : null}{stops(a, c)}</>, total: sum((a) => a.monthlyContribution) },
      reservedCol,
    ],
  },
  equity: {
    fields: [
      owner("Holder"),
      { key: "name", label: "Script", type: "text", required: true, placeholder: "e.g. HDFCBANK" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "buyPrice", label: "Buy price per share", type: "money" },
      { key: "currentValue", label: "Current value", type: "money", required: true },
      reserved,
    ],
    columns: [
      ownerCol("Holder"),
      { label: "Script", cell: (a) => <span className="font-medium">{a.name}</span> },
      { label: "Quantity", align: "right", cell: (a) => a.quantity ?? "–" },
      { label: "Buy price", align: "right", cell: money((a) => a.buyPrice) },
      { label: "Current value", align: "right", cell: money((a) => a.currentValue), total: sum((a) => a.currentValue) },
      reservedCol,
    ],
  },
};

export function AssetsTab({ clientId, members, editable }: TabProps) {
  const assets = useClientRecords("assets", clientId);
  const goals = useClientRecords("goals", clientId);
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        Sections follow the Assets tab of the data sheet. &quot;Reserved for&quot; is Priority Goal 1, 2 and 3 for each investment, as used by the goal-funding calculation.
      </p>
      {ASSET_SECTIONS.map(({ category, title, noun }) => {
        const s = SECTIONS[category];
        return (
          <RecordSection
            key={category}
            kind="assets"
            clientId={clientId}
            title={title}
            noun={noun}
            rows={assets.filter((a) => a.category === category)}
            fields={[
              ...s.fields.slice(0, -1),
              ...(HAS_CONTRIBUTIONS.includes(category) ? contributionEnd : []),
              usableFrom,
              s.fields.at(-1)!, // "Reserved for goals" stays last
            ]}
            columns={s.columns}
            validate={s.validate}
            fixed={{ category }}
            funding="assetId"
            editable={editable}
            members={members}
            goals={goals}
            footnote={category === "equity" ? "Please attach a copy of the client's demat statement." : undefined}
          />
        );
      })}
    </div>
  );
}
