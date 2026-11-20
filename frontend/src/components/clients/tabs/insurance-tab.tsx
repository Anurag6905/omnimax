"use client";

import { GENERAL_POLICY_TYPES, POLICY_STATUS, type GeneralInsurancePolicy, type LifeInsurancePolicy } from "@omnimax/shared";
import { RecordSection, type ColumnDef, type Draft, type FieldDef } from "@/components/records/record-section";
import { Badge } from "@/components/ui/badge";
import { COVER_TYPE_LABEL, PREMIUM_FREQUENCIES } from "@/data/sheet-lists";
import { useClientRecords } from "@/lib/store";
import { formatDate, formatINR } from "@/lib/format";
import type { TabProps } from "./types";

const LIFE_FIELDS: FieldDef[] = [
  { key: "insuredMemberId", label: "Insured", type: "member", required: true },
  { key: "policyName", label: "Policy name", type: "text", required: true },
  { key: "policyNumber", label: "Policy number", type: "text" },
  { key: "commencementDate", label: "Commencement date", type: "date" },
  { key: "sumAssured", label: "Sum assured", type: "money", required: true },
  { key: "premiumAmount", label: "Premium amount", type: "money" },
  { key: "premiumFrequency", label: "Premium frequency", type: "select", options: PREMIUM_FREQUENCIES },
  { key: "policyTermYears", label: "Policy term (years)", type: "number", integer: true, max: 100 },
  { key: "pptYears", label: "Premium paying term (years)", type: "number", integer: true, max: 100 },
  { key: "surrenderValue", label: "Surrender value", type: "money" },
  { key: "maturityValue", label: "Maturity value", type: "money" },
  { key: "riders", label: "Riders", type: "text" },
  { key: "nomineeName", label: "Nominee name", type: "text" },
  { key: "status", label: "Policy status", type: "select", options: POLICY_STATUS },
];

const lifeValidate = (d: Draft): Record<string, string> =>
  d.policyTermYears && d.pptYears && Number(d.pptYears) > Number(d.policyTermYears) ? { pptYears: "Premium paying term can't be longer than the policy term." } : {};

const LIFE_COLUMNS: Array<ColumnDef<LifeInsurancePolicy>> = [
  { label: "Insured", cell: (p, c) => c.member(p.insuredMemberId) },
  { label: "Policy", cell: (p) => <>{p.policyName}<span className="block text-xs text-muted">{p.policyNumber ?? "No number"}, since {formatDate(p.commencementDate)}</span></> },
  { label: "Sum assured", align: "right", cell: (p) => formatINR(p.sumAssured), total: (rows) => rows.reduce((s, p) => s + (p.sumAssured ?? 0), 0) },
  { label: "Premium", align: "right", cell: (p) => <>{formatINR(p.premiumAmount)}<span className="block text-xs text-muted">{p.premiumFrequency}</span></>, total: (rows) => rows.reduce((s, p) => s + (p.premiumAmount ?? 0), 0) },
  { label: "Term / PPT", align: "right", cell: (p) => `${p.policyTermYears ?? "–"} / ${p.pptYears ?? "–"} yrs` },
  { label: "Surrender / maturity", align: "right", cell: (p) => <>{formatINR(p.surrenderValue)}<span className="block text-xs text-muted">{formatINR(p.maturityValue)}</span></> },
  { label: "Nominee", cell: (p) => p.nomineeName ?? "–" },
  { label: "Status", cell: (p) => (p.status ? <Badge tone={p.status === "Active" ? "brand" : "danger"}>{p.status}</Badge> : "–") },
];

const GENERAL_FIELDS: FieldDef[] = [
  { key: "insuredMemberId", label: "Insured", type: "member", required: true, hint: "For a floater, the main person covered" },
  { key: "policyName", label: "Policy name", type: "text", required: true },
  { key: "coverType", label: "Cover", type: "select", options: Object.entries(COVER_TYPE_LABEL).map(([value, label]) => ({ value, label: `${label} (${value})` })), required: true },
  { key: "policyType", label: "Policy type", type: "select", options: GENERAL_POLICY_TYPES },
  { key: "commencementDate", label: "Commencement date", type: "date" },
  { key: "renewalDate", label: "Renewal date", type: "date" },
  { key: "sumAssured", label: "Sum assured", type: "money", required: true },
  { key: "annualPremium", label: "Annual premium", type: "money" },
  { key: "tenureYears", label: "Tenure (years)", type: "number", integer: true, max: 10 },
];

const GENERAL_COLUMNS: Array<ColumnDef<GeneralInsurancePolicy>> = [
  { label: "Insured", cell: (p, c) => c.member(p.insuredMemberId) },
  { label: "Policy", cell: (p) => <>{p.policyName}<span className="block text-xs text-muted">{p.coverType ? COVER_TYPE_LABEL[p.coverType] : ""}{p.policyType ? `, ${p.policyType}` : ""}</span></> },
  { label: "Sum assured", align: "right", cell: (p) => formatINR(p.sumAssured), total: (rows) => rows.reduce((s, p) => s + (p.sumAssured ?? 0), 0) },
  { label: "Annual premium", align: "right", cell: (p) => formatINR(p.annualPremium), total: (rows) => rows.reduce((s, p) => s + (p.annualPremium ?? 0), 0) },
  { label: "Tenure", align: "right", cell: (p) => (p.tenureYears ? `${p.tenureYears} yr` : "–") },
  { label: "Renews", cell: (p) => formatDate(p.renewalDate) },
];

export function InsuranceTab({ clientId, members, editable }: TabProps) {
  const life = useClientRecords("lifePolicies", clientId);
  const general = useClientRecords("generalPolicies", clientId);
  const goals = useClientRecords("goals", clientId);

  return (
    <div className="flex flex-col gap-6">
      {/* Insurance sheet › Health Status: stored on family members, edited in the Family tab */}
      <section className="rounded-lg border border-line bg-white">
        <div className="border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold text-ink">Health status</h3>
          <p className="mt-0.5 text-xs text-muted">Edit these on the Family tab.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Name</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Tobacco</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Health status</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Health history</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-5 py-2.5 text-ink">{m.fullName}</td>
                  <td className="px-5 py-2.5 text-ink-soft">{m.tobaccoUser == null ? "–" : m.tobaccoUser ? "Yes" : "No"}</td>
                  <td className="px-5 py-2.5 text-ink-soft">{m.healthStatus ?? "–"}</td>
                  <td className="px-5 py-2.5 text-ink-soft">{m.healthHistory ?? "–"}</td>
                  <td className="px-5 py-2.5 text-ink-soft">{m.healthRemark ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RecordSection
        kind="lifePolicies"
        clientId={clientId}
        title="Life insurance"
        noun="policy"
        rows={life}
        fields={LIFE_FIELDS}
        columns={LIFE_COLUMNS}
        validate={lifeValidate}
        defaults={{ premiumFrequency: "Yearly", status: "Active" }}
        editable={editable}
        members={members}
        goals={goals}
      />
      <RecordSection
        kind="generalPolicies"
        clientId={clientId}
        title="General insurance: health, personal accident, critical illness"
        noun="policy"
        rows={general}
        fields={GENERAL_FIELDS}
        columns={GENERAL_COLUMNS}
        editable={editable}
        members={members}
        goals={goals}
        footnote="Please attach copies of the client's insurance policies."
      />
    </div>
  );
}
