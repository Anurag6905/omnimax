"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import type { Client, FamilyMember } from "@omnimax/shared";
import { Panel } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Avatar } from "@/components/ui/avatar";
import { Lifeline } from "@/components/clients/lifeline";
import { MemberDialog } from "@/components/clients/member-dialog";
import { STATUS_LABEL, StatusBadge, useVisibleClients } from "@/components/clients/shared";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientStore } from "@/lib/store";
import { ageFromDob, formatDate, yearAtAge } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ClientRecord } from "@/lib/sample-data";

const TABS = [
  { key: "family", label: "Family" },
  { key: "cashflow", label: "Income and expenses" },
  { key: "goals", label: "Goals" },
  { key: "assets", label: "Assets" },
  { key: "liabilities", label: "Liabilities" },
  { key: "insurance", label: "Insurance" },
];

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, users } = useAuth();
  const { members, removeMember } = useClientStore();
  const visible = useVisibleClients();
  const client = visible.find((c) => c.id === id);

  const [editingMember, setEditingMember] = useState<FamilyMember | "new" | null>(null);
  const [removing, setRemoving] = useState<FamilyMember | null>(null);
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

  const family = members.filter((m) => m.clientId === client.id).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
  const editable = can(user?.role, "clients.edit");
  const adviser = users.find((u) => u.id === client.adviserId);

  // simple facts from entered data only (no projections)
  const thisYear = new Date().getFullYear();
  const dependents = family.filter((m) => m.financiallyDependent).length;
  const upcoming = family
    .map((m) => ({ m, year: yearAtAge(m.dateOfBirth, m.retirementAge) }))
    .filter((x): x is { m: FamilyMember; year: number } => x.year != null && x.year >= thisYear)
    .sort((a, b) => a.year - b.year)[0];
  const lastYear = Math.max(0, ...family.map((m) => yearAtAge(m.dateOfBirth, m.lifeExpectancy) ?? 0));

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
          { label: "Family members", value: String(family.length) },
          { label: "Financially dependent", value: String(dependents) },
          { label: "Next retirement", value: upcoming ? String(upcoming.year) : "None ahead", sub: upcoming ? `${upcoming.m.fullName}, at ${upcoming.m.retirementAge}` : undefined },
          { label: "Last life-expectancy year", value: lastYear ? String(lastYear) : "–", sub: lastYear ? `${lastYear - thisYear} years from now` : undefined },
        ].map((f) => (
          <div key={f.label} className="bg-white px-5 py-4">
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">{f.value}</dd>
            {f.sub && <dd className="text-xs text-muted">{f.sub}</dd>}
          </div>
        ))}
      </dl>

      <Panel title="Household life line" className="mt-6">
        <div className="px-5 py-4">
          {family.length ? <Lifeline members={family} /> : <p className="text-sm text-muted">Add family members to see their life line.</p>}
        </div>
      </Panel>

      <div className="mt-8 border-b border-line">
        <div role="tablist" aria-label="Client data" className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.key === "family";
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                disabled={!active}
                title={active ? undefined : "Comes in the next build"}
                className={cn(
                  "border-b-2 pb-2.5 text-sm whitespace-nowrap",
                  active ? "border-brand font-medium text-ink" : "cursor-not-allowed border-transparent text-faint",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <section role="tabpanel" aria-label="Family" className="pt-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">Everyone in the household plan. Ages use the data sheet rule: this year minus year of birth.</p>
          {editable && (
            <Button size="sm" onClick={() => setEditingMember("new")}>
              <Plus size={15} /> Add family member
            </Button>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Date of birth</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Age</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Retirement age</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Life expectancy</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Dependent</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Residence</th>
                {editable && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {family.map((m) => (
                <tr key={m.id} className="group">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.fullName} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-ink">
                          {m.fullName}
                          {m.isPrimary && <Badge tone="brand">Main client</Badge>}
                        </p>
                        <p className="text-xs text-muted">{[m.relationship, m.occupation].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(m.dateOfBirth)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{ageFromDob(m.dateOfBirth) ?? "–"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{m.retirementAge ?? <span className="text-faint">–</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{m.lifeExpectancy}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{m.financiallyDependent == null ? "–" : m.financiallyDependent ? "Yes" : "No"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{m.residenceStatus ?? "–"}</td>
                  {editable && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingMember(m)} aria-label={`Edit ${m.fullName}`}>
                          <Pencil size={14} /> Edit
                        </Button>
                        {!m.isPrimary && (
                          <Button variant="ghost" size="sm" onClick={() => setRemoving(m)} aria-label={`Remove ${m.fullName}`} className="text-muted hover:text-danger">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {family.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <UserRound className="text-faint" />
              <p className="mt-2 text-sm text-muted">No family members yet.</p>
            </div>
          )}
        </div>
      </section>

      {client.remarks && (
        <Panel title="Adviser remarks" className="mt-6">
          <p className="max-w-[72ch] px-5 py-4 text-sm text-ink-soft">{client.remarks}</p>
        </Panel>
      )}

      {editingMember && (
        <MemberDialog clientId={client.id} member={editingMember === "new" ? undefined : editingMember} onClose={() => setEditingMember(null)} />
      )}

      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.fullName ?? ""}?`}
        description="They'll be taken out of this household plan. You can add them again later."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>Keep</Button>
            <Button variant="danger" onClick={() => { removeMember(removing!.id); setRemoving(null); }}>Remove member</Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">Any goals planned for this person will need a new owner once goals are added.</p>
      </Dialog>

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
