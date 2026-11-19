"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { INCOME_FREQUENCIES, INCOME_TYPES, type FamilyMember, type Income } from "@omnimax/shared";
import { RecordSection, GoalLinksCell, type ColumnDef, type FieldDef } from "@/components/records/record-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { EXPENSE_CATEGORIES, EXPENSE_GROUP_LABEL } from "@/data/sheet-lists";
import { useClientRecords, useClientStore } from "@/lib/store";
import { formatINR, yearAtAge } from "@/lib/format";
import type { TabProps } from "./types";

/** Payments a year for each income frequency on the sheet. */
const PER_YEAR: Record<Income["frequency"], number> = { Monthly: 12, "Half-Yearly": 2, Annually: 1 };
const perYear = (i: Income) => i.amount * PER_YEAR[i.frequency];

const INCOME_FIELDS: FieldDef[] = [
  { key: "memberId", label: "Earned by", type: "member", required: true },
  { key: "incomeType", label: "Income type", type: "select", options: INCOME_TYPES, required: true },
  { key: "frequency", label: "Frequency", type: "select", options: INCOME_FREQUENCIES, required: true },
  { key: "amount", label: "Amount each time, after tax", type: "money", required: true },
  { key: "annualGrowthPct", label: "Yearly growth", type: "percent", hint: "Expected yearly raise or rent increase" },
  { key: "startYear", label: "Starts in", type: "year", hint: "Leave blank if already earning" },
  {
    key: "endRule", label: "Ends", type: "select", required: true,
    options: [
      { value: "retirement", label: "At the earner's retirement" },
      { value: "year", label: "In a set year" },
      { value: "lifetime", label: "Continues for life (e.g. rent, pension)" },
    ],
    hint: "\"At retirement\" moves automatically if the retirement age changes",
  },
  { key: "endYear", label: "Last year of this income", type: "year", required: true, showIf: (d) => d.endRule === "year" },
  { key: "remark", label: "Remark", type: "text", wide: true },
  { key: "goals", label: "Reserved for goals", type: "goals" },
];

/** "2026 – at retirement (2040)" in the earner's own dates. */
function incomeYears(i: Income, members: FamilyMember[]): React.ReactNode {
  const start = i.startYear ? String(i.startYear) : "Now";
  if (i.endRule === "year") return `${start} – ${i.endYear}`;
  if (i.endRule === "lifetime") return `${start} – for life`;
  if (i.endRule === "retirement") {
    const m = members.find((x) => x.id === i.memberId);
    const y = yearAtAge(m?.dateOfBirth, m?.retirementAge);
    return <>{start} – retirement<span className="block text-xs text-muted">{y ? `${y}, moves with retirement age` : "Set retirement age in Family"}</span></>;
  }
  return `${start} – not set`;
}

const incomeColumns = (members: FamilyMember[]): Array<ColumnDef<Income>> => [
  { label: "Earned by", cell: (r, c) => c.member(r.memberId) },
  { label: "Type", cell: (r) => <>{r.incomeType}{r.remark && <span className="block text-xs text-muted">{r.remark}</span>}</> },
  { label: "Frequency", cell: (r) => r.frequency },
  { label: "Amount", align: "right", cell: (r) => formatINR(r.amount) },
  { label: "Per year", align: "right", cell: (r) => <>{formatINR(perYear(r))}{r.annualGrowthPct ? <span className="block text-xs text-muted">+{r.annualGrowthPct}% a year</span> : null}</>, total: (rows) => rows.reduce((s, r) => s + perYear(r), 0) },
  { label: "Years", cell: (r) => incomeYears(r, members) },
  { label: "Reserved for", cell: (r, c) => <GoalLinksCell links={c.links(r.id)} goal={c.goal} /> },
];

export function CashflowTab({ clientId, members, editable }: TabProps) {
  const incomes = useClientRecords("incomes", clientId);
  const goals = useClientRecords("goals", clientId);
  return (
    <div className="flex flex-col gap-6">
      <RecordSection
        kind="incomes"
        clientId={clientId}
        title="Income, after tax"
        noun="income"
        rows={incomes}
        fields={INCOME_FIELDS}
        columns={incomeColumns(members)}
        defaults={{ frequency: "Monthly", endRule: "retirement" }}
        validate={(d): Record<string, string> => (d.endRule === "year" && d.startYear && d.endYear && Number(d.endYear) < Number(d.startYear) ? { endYear: "Can't end before it starts." } : {})}
        funding="incomeId"
        editable={editable}
        members={members}
        goals={goals}
        footnote="Per year = amount × payments a year (12, 2 or 1). The data sheet's own Annually column is Monthly × 12, so confirm how Omnimax counts half-yearly and annual income."
      />
      <ExpensesPanel clientId={clientId} editable={editable} />
    </div>
  );
}

/** Personal Details › Outflow – Expenses: 18 fixed lines in three groups. */
function ExpensesPanel({ clientId, editable }: { clientId: string; editable: boolean }) {
  const expenses = useClientRecords("expenses", clientId);
  const { setExpenses } = useClientStore();
  const [draft, setDraft] = useState<Record<number, string> | null>(null);
  const [error, setError] = useState<string>();

  const saved = (id: number) => expenses.find((e) => e.categoryId === id)?.monthlyAmount;
  const current = (id: number) => (draft ? Number(draft[id]?.replace(/[,\s]/g, "") || 0) : saved(id) ?? 0);
  const groups = (["Household", "Lifestyle", "Misc"] as const).map((g) => ({ g, lines: EXPENSE_CATEGORIES.filter((c) => c.groupName === g) }));
  const groupTotal = (g: (typeof groups)[number]) => g.lines.reduce((s, l) => s + current(l.id), 0);
  const total = groups.reduce((s, g) => s + groupTotal(g), 0);

  function startEdit() {
    setError(undefined);
    setDraft(Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, saved(c.id)?.toString() ?? ""])));
  }
  function save() {
    if (!draft) return;
    const amounts: Record<number, number | undefined> = {};
    for (const c of EXPENSE_CATEGORIES) {
      const raw = draft[c.id]?.replace(/[,\s]/g, "");
      if (!raw) continue;
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0) return setError(`Check the amount for "${c.name}".`);
      amounts[c.id] = n;
    }
    setExpenses(clientId, amounts);
    setDraft(null);
  }

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Expenses</h3>
          <p className="mt-0.5 text-xs text-muted">Monthly amounts. A rough total under Food, Grocery is fine if the client has no breakdown.</p>
        </div>
        {editable && !draft && <Button size="sm" variant="secondary" onClick={startEdit}><Pencil size={14} /> Edit expenses</Button>}
        {draft && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save expenses</Button>
          </div>
        )}
      </div>
      {error && <p role="alert" className="mx-5 mt-3 rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              <th scope="col" className="px-5 py-2.5 font-medium">Particulars</th>
              <th scope="col" className="w-48 px-5 py-2.5 text-right font-medium">Monthly</th>
              <th scope="col" className="w-40 px-5 py-2.5 text-right font-medium">Annually</th>
            </tr>
          </thead>
          {groups.map((grp) => (
            <tbody key={grp.g} className="divide-y divide-line border-b border-line">
              {grp.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-2 text-ink-soft">{l.name}</td>
                  <td className="px-5 py-1.5 text-right">
                    {draft ? (
                      <Input
                        aria-label={`${l.name}, monthly`}
                        inputMode="decimal"
                        value={draft[l.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d!, [l.id]: e.target.value }))}
                        className="h-8 w-40 text-right"
                      />
                    ) : (
                      <span className={saved(l.id) == null ? "text-faint" : "text-ink"}>{saved(l.id) == null ? "–" : formatINR(saved(l.id))}</span>
                    )}
                  </td>
                  <td className="px-5 py-2 text-right text-muted">{current(l.id) ? formatINR(current(l.id) * 12) : "–"}</td>
                </tr>
              ))}
              <tr className="bg-surface/60 font-medium">
                <td className="px-5 py-2.5 text-ink">{EXPENSE_GROUP_LABEL[grp.g]}</td>
                <td className="px-5 py-2.5 text-right text-ink">{formatINR(groupTotal(grp))}</td>
                <td className="px-5 py-2.5 text-right text-ink">{formatINR(groupTotal(grp) * 12)}</td>
              </tr>
            </tbody>
          ))}
          <tfoot>
            <tr className="font-semibold">
              <td className="px-5 py-3 text-ink">Total expenses</td>
              <td className="px-5 py-3 text-right text-ink">{formatINR(total)}</td>
              <td className="px-5 py-3 text-right text-ink">{formatINR(total * 12)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="border-t border-line px-5 py-2.5 text-xs text-muted">Annually = monthly × 12, as in the data sheet.</p>
    </section>
  );
}
