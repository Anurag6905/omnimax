"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import type { Client, FamilyMember } from "@omnimax/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { STATUS_LABEL, StatusBadge, useVisibleClients } from "@/components/clients/shared";
import { FamilyTab } from "@/components/clients/tabs/family-tab";
import { CashflowTab } from "@/components/clients/tabs/cashflow-tab";
import { GoalsTab } from "@/components/clients/tabs/goals-tab";
import { AssetsTab } from "@/components/clients/tabs/assets-tab";
import { LiabilitiesTab } from "@/components/clients/tabs/liabilities-tab";
import { InsuranceTab } from "@/components/clients/tabs/insurance-tab";
import { AssumptionsTab } from "@/components/clients/tabs/assumptions-tab";
import type { TabProps } from "@/components/clients/tabs/types";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientStore } from "@/lib/store";
import { formatDate, formatINRShort, yearAtAge } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ClientRecord } from "@/data/sample-data";

/** Profile tabs, in the order of the Client Data Gathering Sheet. */
const TABS: Array<{ key: string; label: string; Component: (p: TabProps) => React.ReactNode }> = [
  { key: "family", label: "Family", Component: FamilyTab },
  { key: "cashflow", label: "Income and expenses", Component: CashflowTab },
  { key: "goals", label: "Goals", Component: GoalsTab },
  { key: "assets", label: "Assets", Component: AssetsTab },
  { key: "liabilities", label: "Liabilities", Component: LiabilitiesTab },
  { key: "insurance", label: "Insurance", Component: InsuranceTab },
  { key: "assumptions", label: "Assumptions", Component: AssumptionsTab },
];

/** Keep the open tab in the URL (#goals) so a refresh or shared link opens the same tab. */
function useTab(): [string, (k: string) => void] {
  const [tab, setTab] = useState("family");
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      setTab(TABS.some((t) => t.key === h) ? h : "family");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const choose = (k: string) => {
    history.replaceState(null, "", `#${k}`);
    setTab(k);
  };
  return [tab, choose];
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, users } = useAuth();
  const { members, records, planAssumptions } = useClientStore();
  const visible = useVisibleClients();
  const client = visible.find((c) => c.id === id);
  const [tab, setTab] = useTab();
  const [editingClient, setEditingClient] = useState(false);

  if (!client) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="font-medium text-ink">This client isn&apos;t in your list</p>
        <p className="mt-1 text-sm text-muted">It may belong to another adviser, or the link is wrong.</p>
        <Link href="/clients" className="mt-4 text-sm font-medium text-brand hover:underline">Back to clients</Link>
      </div>
    );
  }

  const family = members
    .filter((m) => m.clientId === client.id)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
  const editable = can(user?.role, "clients.edit");
  const adviser = users.find((u) => u.id === client.adviserId);
  const mine = <T extends { clientId: string }>(list: T[]) => list.filter((r) => r.clientId === client.id);

  // simple facts from entered data only; no projections in Phase 1A
  const thisYear = new Date().getFullYear();
  const upcoming = family
    .map((m) => ({ m, year: yearAtAge(m.dateOfBirth, m.retirementAge) }))
    .filter((x): x is { m: FamilyMember; year: number } => x.year != null && x.year >= thisYear)
    .sort((a, b) => a.year - b.year)[0];
  const goalCount = mine(records.goals).length;
  const loansOutstanding = mine(records.liabilities).reduce((s, l) => s + l.principalOutstanding, 0);
  const counts: Record<string, number> = {
    family: family.length,
    cashflow: mine(records.incomes).length,
    goals: goalCount,
    assets: mine(records.assets).length,
    liabilities: mine(records.liabilities).length,
    insurance: mine(records.lifePolicies).length + mine(records.generalPolicies).length,
    assumptions: (() => {
      const p = planAssumptions.find((x) => x.clientId === client.id);
      return p ? p.returns.length + Object.values(p.inflation).filter((v) => v != null).length : 0;
    })(),
  };
  const Active = TABS.find((t) => t.key === tab)!.Component;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-[13px] text-muted">
        <Link href="/clients" className="hover:text-ink">Clients</Link>
        <ChevronRight size={14} />
        <span className="text-ink-soft">{client.householdName}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.01em] text-ink">{client.householdName}</h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {client.clientCode}, adviser {adviser?.fullName ?? "not assigned"}
            {client.dataSheetDate && `, data sheet from ${formatDate(client.dataSheetDate)}`}
          </p>
        </div>
        {editable && (
          <Button variant="secondary" onClick={() => setEditingClient(true)}>
            <Pencil size={15} /> Edit household
          </Button>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
        {[
          { label: "Family members", value: String(family.length), sub: `${family.filter((m) => m.financiallyDependent).length} financially dependent` },
          { label: "Next retirement", value: upcoming ? String(upcoming.year) : "None ahead", sub: upcoming ? `${upcoming.m.fullName}, at ${upcoming.m.retirementAge}` : undefined },
          { label: "Goals", value: String(goalCount), sub: goalCount ? `${mine(records.goals).filter((g) => g.priorityLevel === "High").length} high priority` : "None added" },
          { label: "Loans outstanding", value: loansOutstanding ? formatINRShort(loansOutstanding) : "None", sub: counts.liabilities ? `${counts.liabilities} loan${counts.liabilities > 1 ? "s" : ""}` : undefined },
        ].map((f) => (
          <div key={f.label} className="bg-white px-5 py-4">
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">{f.value}</dd>
            {f.sub && <dd className="text-xs text-muted">{f.sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-8 border-b border-line">
        <div role="tablist" aria-label="Client data" className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={active}
                aria-controls="tab-panel"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 pb-2.5 text-sm whitespace-nowrap transition-colors",
                  active ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {t.label}
                {t.key === "assumptions" ? (
                  counts.assumptions ? <span className={cn("rounded-full px-1.5 text-[11px]", active ? "bg-brand-50 text-brand" : "bg-surface text-faint")} title="Rates changed for this plan">{counts.assumptions} changed</span> : null
                ) : (
                  <span className={cn("rounded-full px-1.5 text-[11px]", active ? "bg-brand-50 text-brand" : "bg-surface text-faint")}>{counts[t.key]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <section id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
        <Active clientId={client.id} members={family} editable={editable} />
      </section>

      {client.remarks && tab === "family" && (
        <section className="mt-6 rounded-lg border border-line bg-white">
          <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink">Adviser remarks</h2>
          <p className="max-w-[72ch] px-5 py-4 text-sm text-ink-soft">{client.remarks}</p>
        </section>
      )}

      {editingClient && <EditHouseholdDialog client={client} onClose={() => setEditingClient(false)} />}
    </>
  );
}

function EditHouseholdDialog({ client, onClose }: { client: ClientRecord; onClose: () => void }) {
  const { user, users } = useAuth();
  const { updateClient } = useClientStore();
  const [name, setName] = useState(client.householdName);
  const [status, setStatus] = useState(client.status);
  const [adviserId, setAdviserId] = useState(client.adviserId ?? "");
  const [remarks, setRemarks] = useState(client.remarks ?? "");
  const [error, setError] = useState<string>();
  const reassign = can(user?.role, "clients.reassign");

  function save() {
    if (!name.trim()) return setError("Enter a household name.");
    updateClient(client.id, { householdName: name.trim(), status, adviserId: adviserId || undefined, remarks: remarks.trim() || undefined });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit household"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save changes</Button></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Household name" required error={error} className="sm:col-span-2">
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!error} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as Client["status"])}>
              {(Object.keys(STATUS_LABEL) as Client["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Adviser" hint={reassign ? undefined : "Operations or admin can reassign clients"}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={adviserId} disabled={!reassign} onChange={(e) => setAdviserId(e.target.value)}>
              <option value="">Not assigned</option>
              {users.filter((u) => u.role === "adviser").map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Remarks" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={remarks} onChange={(e) => setRemarks(e.target.value)} />}
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
