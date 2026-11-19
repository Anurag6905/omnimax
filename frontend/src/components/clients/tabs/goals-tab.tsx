"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { GOAL_TYPES, PRIORITY_LEVELS, type FamilyMember, type Goal, type GoalType } from "@omnimax/shared";
import { RecordSection, type ColumnDef, type Draft, type FieldDef } from "@/components/records/record-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GOAL_TYPE_LABEL, HOUSE_CAR_GOALS } from "@/data/sheet-lists";
import { useClientRecords, useClientStore } from "@/lib/store";
import { formatINR, yearAtAge } from "@/lib/format";
import type { TabProps } from "./types";

/** Goals sheet: one form, fields shown by goal type. */
const is = (...types: GoalType[]) => (d: Draft) => types.includes(d.goalType as GoalType);

const COST_LABEL: Partial<Record<GoalType, string>> = {
  education: "Annual course cost in today's value",
  marriage: "Marriage cost in today's value",
  vacation: "Cost per trip in today's value",
  house: "Cost as on today",
  car: "Cost as on today",
  other: "Amount",
};

const GOAL_FIELDS: FieldDef[] = [
  { key: "goalType", label: "Goal type", type: "select", options: GOAL_TYPES.map((t) => ({ value: t, label: GOAL_TYPE_LABEL[t] })), required: true },
  { key: "priorityLevel", label: "Priority", type: "select", options: PRIORITY_LEVELS, required: true, hint: "As recorded on the data sheet" },
  {
    key: "name", label: "Goal name", type: "text", required: true, wide: true,
    suggestions: HOUSE_CAR_GOALS, placeholder: "e.g. Aarav – engineering",
  },
  { key: "memberId", label: (d) => (d.goalType === "retirement" ? "Whose retirement" : "Who is this for"), type: "member", showIf: is("retirement", "education", "marriage"), required: true },
  { key: "currentMonthlyExpenses", label: "Current monthly expenses", type: "money", showIf: is("retirement"), required: true, hint: "Retirement age and life expectancy come from the Family tab" },
  { key: "startAge", label: (d) => (d.goalType === "marriage" ? "Age at marriage" : "Age when the course starts"), type: "number", integer: true, min: 1, max: 100, showIf: is("education", "marriage"), required: true },
  { key: "tenureYears", label: "Course length in years", type: "number", integer: true, min: 1, max: 10, showIf: is("education"), required: true },
  { key: "startYear", label: (d) => (d.goalType === "vacation" ? "First trip year" : "Year of purchase"), type: "year", showIf: is("vacation", "house", "car"), required: true },
  { key: "endYear", label: "Last trip year", type: "year", showIf: is("vacation"), required: true },
  { key: "frequencyYears", label: "Travel every how many years", type: "number", integer: true, min: 1, max: 20, showIf: is("vacation"), required: true, hint: "1 = every year" },
  { key: "costToday", label: (d) => COST_LABEL[d.goalType as GoalType] ?? "Cost in today's value", type: "money", showIf: (d) => !!d.goalType && d.goalType !== "retirement", required: true },
  { key: "loanAmount", label: "Loan amount, if any", type: "money", showIf: is("house", "car") },
  { key: "isWanted", label: "Client wants this goal", type: "yesno", showIf: is("other") },
  { key: "timeFrame", label: "Time frame", type: "text", showIf: is("other"), placeholder: "e.g. Within 3 years, 2030" },
  { key: "remark", label: "Remark", type: "text", wide: true },
];

function validate(d: Draft) {
  const e: Record<string, string> = {};
  if (d.goalType === "vacation" && d.startYear && d.endYear && Number(d.endYear) < Number(d.startYear)) e.endYear = "Last trip year can't be before the first.";
  if ((d.goalType === "house" || d.goalType === "car") && d.loanAmount && d.costToday && Number(d.loanAmount.replace(/,/g, "")) > Number(d.costToday.replace(/,/g, ""))) e.loanAmount = "Loan can't be more than the cost.";
  return e;
}

/** When the goal happens, in the words of the sheet. */
function when(g: Goal, members: FamilyMember[]): string {
  const m = members.find((x) => x.id === g.memberId);
  switch (g.goalType) {
    case "retirement": {
      const y = yearAtAge(m?.dateOfBirth, m?.retirementAge);
      return m?.retirementAge ? `At ${m.retirementAge}${y ? `, ${y}` : ""}` : "Set retirement age in Family";
    }
    case "education": {
      const y = yearAtAge(m?.dateOfBirth, g.startAge);
      return `Age ${g.startAge}${y ? ` (${y})` : ""}, ${g.tenureYears} yrs`;
    }
    case "marriage": {
      const y = yearAtAge(m?.dateOfBirth, g.startAge);
      return `Age ${g.startAge}${y ? ` (${y})` : ""}`;
    }
    case "vacation":
      return `${g.startYear}–${g.endYear}, every ${g.frequencyYears === 1 ? "year" : `${g.frequencyYears} yrs`}`;
    case "house": case "car":
      return String(g.startYear ?? "–");
    default:
      return g.timeFrame ?? "–";
  }
}

const LEVEL_TONE = { High: "danger", Medium: "warn", Low: "neutral" } as const;

export function GoalsTab({ clientId, members, editable }: TabProps) {
  const goals = useClientRecords("goals", clientId);
  const links = useClientRecords("goalLinks", clientId);
  const assets = useClientRecords("assets", clientId);
  const incomes = useClientRecords("incomes", clientId);
  const { saveRecord } = useClientStore();
  const sorted = [...goals].sort((a, b) => (a.priorityRank ?? 999) - (b.priorityRank ?? 999));

  /** Swap a goal with its neighbour and renumber 1..n. */
  function move(goal: Goal, dir: -1 | 1) {
    const list = [...sorted];
    const i = list.findIndex((g) => g.id === goal.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    list.forEach((g, idx) => g.priorityRank !== idx + 1 && saveRecord("goals", { ...g, priorityRank: idx + 1 }));
  }

  const fundedBy = (goalId: string) =>
    links
      .filter((l) => l.goalId === goalId)
      .map((l) => {
        const a = assets.find((x) => x.id === l.assetId);
        const i = incomes.find((x) => x.id === l.incomeId);
        return a ? a.name ?? a.subType ?? "Asset" : i ? `${i.incomeType}` : "–";
      });

  const columns: Array<ColumnDef<Goal>> = [
    { label: "Order", align: "right", cell: (g) => <span className="font-semibold text-ink">{g.priorityRank ?? "–"}</span> },
    {
      label: "Goal",
      cell: (g, c) => (
        <>
          <span className="font-medium">{g.name}</span>
          <span className="block text-xs text-muted">{GOAL_TYPE_LABEL[g.goalType]}{g.memberId ? `, ${c.member(g.memberId)}` : ""}{g.isWanted === false ? ", not wanted" : ""}</span>
        </>
      ),
    },
    { label: "When", cell: (g) => when(g, members) },
    {
      label: "Today's value",
      align: "right",
      cell: (g) =>
        g.goalType === "retirement" ? (
          <>{formatINR(g.currentMonthlyExpenses)}<span className="block text-xs text-muted">monthly expenses</span></>
        ) : g.goalType === "education" ? (
          <>{formatINR((g.costToday ?? 0) * (g.tenureYears ?? 0))}<span className="block text-xs text-muted">{formatINR(g.costToday)} a year</span></>
        ) : g.goalType === "vacation" ? (
          <>{formatINR(g.costToday)}<span className="block text-xs text-muted">per trip</span></>
        ) : (
          <>{formatINR(g.costToday)}{g.loanAmount ? <span className="block text-xs text-muted">{formatINR(g.loanAmount)} on loan</span> : null}</>
        ),
    },
    { label: "Priority", cell: (g) => (g.priorityLevel ? <Badge tone={LEVEL_TONE[g.priorityLevel]}>{g.priorityLevel}</Badge> : "–") },
    {
      label: "Reserved from",
      cell: (g) => {
        const list = fundedBy(g.id);
        return list.length ? <span className="flex flex-col gap-0.5 text-[13px]">{list.map((n, i) => <span key={i}>{n}</span>)}</span> : <span className="text-faint">Nothing reserved</span>;
      },
    },
  ];

  return (
    <RecordSection
      kind="goals"
      clientId={clientId}
      title="Goals and aspirations"
      description="Order sets which goal is funded first. Use the arrows to change it."
      noun="goal"
      rows={sorted}
      fields={GOAL_FIELDS}
      columns={columns}
      defaults={{ tenureYears: "3", frequencyYears: "1" }}
      validate={validate}
      beforeSave={(g, isNew) => (isNew ? { ...g, priorityRank: sorted.length + 1 } : g)}
      editable={editable}
      members={members}
      goals={goals}
      rowActions={(g) => (
        <>
          <Button variant="ghost" size="sm" aria-label={`Move ${g.name} up`} disabled={g.id === sorted[0]?.id} onClick={() => move(g, -1)}><ArrowUp size={14} /></Button>
          <Button variant="ghost" size="sm" aria-label={`Move ${g.name} down`} disabled={g.id === sorted.at(-1)?.id} onClick={() => move(g, 1)}><ArrowDown size={14} /></Button>
        </>
      )}
      footnote="High / Medium / Low is what the client said on the data sheet. The order number is what the funding calculation will use (1 is funded first); how the two relate is still to be confirmed. Education cost = annual cost × course length, as on the sheet."
    />
  );
}
