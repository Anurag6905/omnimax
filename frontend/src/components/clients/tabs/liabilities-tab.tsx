"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { CreditCardProfile, Liability } from "@omnimax/shared";
import { RecordSection, type ColumnDef, type FieldDef } from "@/components/records/record-section";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { LOAN_TYPES } from "@/data/sheet-lists";
import { useClientRecords, useClientStore } from "@/lib/store";
import { formatINR, formatMonth, formatPct } from "@/lib/format";
import type { TabProps } from "./types";

const LOAN_FIELDS: FieldDef[] = [
  { key: "ownerMemberId", label: "Owner", type: "member", required: true },
  { key: "loanType", label: "Loan type", type: "select", options: LOAN_TYPES, required: true },
  { key: "principalOutstanding", label: "Principal outstanding", type: "money", required: true },
  { key: "emiAmount", label: "EMI amount", type: "money" },
  { key: "emiEndMonth", label: "EMI continues till", type: "month" },
  { key: "interestRatePct", label: "Interest rate", type: "percent" },
  { key: "lender", label: "Financial institution or lender", type: "text", wide: true },
];

const LOAN_COLUMNS: Array<ColumnDef<Liability>> = [
  { label: "Owner", cell: (l, c) => c.member(l.ownerMemberId) },
  { label: "Loan", cell: (l) => <>{l.loanType}<span className="block text-xs text-muted">{l.lender}</span></> },
  { label: "Outstanding", align: "right", cell: (l) => formatINR(l.principalOutstanding), total: (rows) => rows.reduce((s, l) => s + l.principalOutstanding, 0) },
  { label: "EMI", align: "right", cell: (l) => formatINR(l.emiAmount), total: (rows) => rows.reduce((s, l) => s + (l.emiAmount ?? 0), 0) },
  { label: "EMI till", cell: (l) => formatMonth(l.emiEndMonth) },
  { label: "Rate", align: "right", cell: (l) => formatPct(l.interestRatePct) },
];

export function LiabilitiesTab({ clientId, members, editable }: TabProps) {
  const loans = useClientRecords("liabilities", clientId);
  const goals = useClientRecords("goals", clientId);
  return (
    <div className="flex flex-col gap-6">
      <RecordSection
        kind="liabilities"
        clientId={clientId}
        title="Loans"
        noun="loan"
        rows={loans}
        fields={LOAN_FIELDS}
        columns={LOAN_COLUMNS}
        editable={editable}
        members={members}
        goals={goals}
        footnote="Please attach a copy of each loan's amortisation schedule."
      />
      <CreditCardPanel clientId={clientId} editable={editable} />
    </div>
  );
}

/** Liabilities › Credit cards: five questions, one answer set per client. */
function CreditCardPanel({ clientId, editable }: { clientId: string; editable: boolean }) {
  const profile = useClientRecords("creditCards", clientId)[0];
  const { saveCreditCard } = useClientStore();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string>();

  const QUESTIONS = [
    { key: "cardCount", label: "How many credit cards do you have?", show: (p?: CreditCardProfile) => p?.cardCount ?? "–" },
    { key: "outstandingAmount", label: "What is the current outstanding amount?", show: (p?: CreditCardProfile) => formatINR(p?.outstandingAmount) },
    { key: "paymentBehaviour", label: "Do you pay your bills in full or make partial payments?", show: (p?: CreditCardProfile) => p?.paymentBehaviour ?? "–" },
    { key: "yearlyUsage", label: "What is your yearly credit card usage?", show: (p?: CreditCardProfile) => formatINR(p?.yearlyUsage) },
    { key: "yearsUsing", label: "How long have you been using credit cards? (years)", show: (p?: CreditCardProfile) => (p?.yearsUsing != null ? `${p.yearsUsing} years` : "–") },
  ] as const;

  function start() {
    setError(undefined);
    setDraft(Object.fromEntries(QUESTIONS.map((q) => [q.key, profile?.[q.key]?.toString() ?? ""])));
  }

  function save() {
    if (!draft) return;
    const num = (k: string) => {
      const raw = draft[k]?.replace(/[,\s₹]/g, "");
      if (!raw) return undefined;
      const n = Number(raw);
      return Number.isNaN(n) || n < 0 ? NaN : n;
    };
    const values = { cardCount: num("cardCount"), outstandingAmount: num("outstandingAmount"), yearlyUsage: num("yearlyUsage"), yearsUsing: num("yearsUsing") };
    if (Object.values(values).some((v) => Number.isNaN(v))) return setError("Use numbers only, without letters.");
    saveCreditCard({ clientId, ...values, paymentBehaviour: (draft.paymentBehaviour || undefined) as CreditCardProfile["paymentBehaviour"] });
    setDraft(null);
  }

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h3 className="text-[15px] font-semibold text-ink">Credit cards</h3>
        {editable && !draft && <Button size="sm" variant="secondary" onClick={start}><Pencil size={14} /> Edit answers</Button>}
        {draft && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save answers</Button>
          </div>
        )}
      </div>
      {error && <p role="alert" className="mx-5 mt-3 rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
      {draft ? (
        <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
          {QUESTIONS.map((q) => (
            <Field key={q.key} label={q.label}>
              {(id) =>
                q.key === "paymentBehaviour" ? (
                  <Select id={id} value={draft[q.key]} onChange={(e) => setDraft((d) => ({ ...d!, [q.key]: e.target.value }))}>
                    <option value="">Not given</option>
                    <option value="Full">In full</option>
                    <option value="Partial">Partial payments</option>
                  </Select>
                ) : (
                  <Input id={id} inputMode="decimal" value={draft[q.key]} onChange={(e) => setDraft((d) => ({ ...d!, [q.key]: e.target.value }))} />
                )
              }
            </Field>
          ))}
        </div>
      ) : (
        <dl className="divide-y divide-line">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-2.5">
              <dt className="text-sm text-ink-soft">{q.label}</dt>
              <dd className="text-sm font-medium text-ink">{q.show(profile)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
