"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Check, ChevronRight, Info, Pencil, Plus, Trash2, Wand2 } from "lucide-react";
import type { Scenario } from "@omnimax/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useVisibleClients } from "@/components/clients/shared";
import { ScenarioEditor } from "@/components/whatif/scenario-editor";
import { COMPARE_COLOURS, CompareView, type Column } from "@/components/whatif/compare-view";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientRecords, useClientStore } from "@/lib/store";
import { getResults, getScenarioResults } from "@/lib/results";
import { describeChanges } from "@/lib/scenarios";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const MAX_COMPARE = 2;

export default function WhatIfPage() {
  const { id } = useParams<{ id: string }>();
  const client = useVisibleClients().find((c) => c.id === id);
  const { user, users } = useAuth();
  const { members, scenarios, removeScenario, applyScenario, firmAssumptions, planAssumptions } = useClientStore();
  const goals = useClientRecords("goals", id);
  const mine = scenarios.filter((s) => s.clientId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const [selected, setSelected] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<Scenario | "new" | null>(null);
  const [removing, setRemoving] = useState<Scenario | null>(null);
  const [applying, setApplying] = useState<Scenario | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  if (!client) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="font-medium text-ink">This client isn&apos;t in your list</p>
        <Link href="/clients" className="mt-4 text-sm font-medium text-brand hover:underline">Back to clients</Link>
      </div>
    );
  }

  const editable = can(user?.role, "clients.edit");
  const family = members.filter((m) => m.clientId === id).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
  const plan = planAssumptions.find((p) => p.clientId === id);
  // default: compare the first two scenarios
  const chosen = (selected ?? mine.slice(0, MAX_COMPARE).map((s) => s.id)).filter((sid) => mine.some((s) => s.id === sid));

  function toggle(sid: string) {
    setSelected((cur) => {
      const list = cur ?? chosen;
      if (list.includes(sid)) return list.filter((x) => x !== sid);
      return [...list, sid].slice(-MAX_COMPARE);
    });
  }

  const baseResults = getResults(id);
  const columns: Column[] = [
    { key: "plan", name: "Plan", results: baseResults },
    ...chosen.map((sid) => {
      const s = mine.find((x) => x.id === sid)!;
      return { key: s.id, name: s.name, scenario: s, results: baseResults ? getScenarioResults(s.id) : undefined };
    }),
  ];
  const sampleFigures = columns.some((c) => c.results?.illustrative);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-[13px] text-muted">
        <Link href="/clients" className="hover:text-ink">Clients</Link>
        <ChevronRight size={14} />
        <Link href={`/clients/${id}`} className="hover:text-ink">{client.householdName}</Link>
        <ChevronRight size={14} />
        <span className="text-ink-soft">What-if scenarios</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div>
          <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.01em] text-ink">What-if scenarios</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Try a change without touching the plan, save it, and compare up to two scenarios side by side with the plan.
          </p>
        </div>
        {editable && (
          <Button onClick={() => setEditing("new")}><Plus size={16} /> New scenario</Button>
        )}
      </header>

      {applied && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-[13px] text-ink-soft">
          <Check size={16} className="text-brand" /> &quot;{applied}&quot; is now the plan. Its changes are on the client&apos;s profile and Assumptions tab.
        </p>
      )}

      {mine.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-line px-6 py-14 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface text-muted"><Wand2 size={18} /></span>
          <p className="mt-3 font-medium text-ink">No scenarios yet</p>
          <p className="mt-1 max-w-md text-sm text-muted">Create one to test a different retirement age, lower returns, or a change to a goal.</p>
          {editable && <Button className="mt-4" onClick={() => setEditing("new")}><Plus size={16} /> New scenario</Button>}
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">Tick up to {MAX_COMPARE} to compare with the plan.</p>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.map((s) => {
              const on = chosen.includes(s.id);
              const colour = on ? COMPARE_COLOURS[chosen.indexOf(s.id) + 1] : undefined;
              const lines = describeChanges(s.changes, family, goals);
              const author = users.find((u) => u.id === s.createdBy)?.fullName;
              return (
                <li key={s.id} className={cn("flex flex-col rounded-lg border bg-white transition-colors", on ? "border-brand/40 ring-1 ring-brand/20" : "border-line")}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 pt-4">
                    <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="mt-1 size-4 accent-[var(--color-brand)]" aria-label={`Compare ${s.name}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        {colour && <span aria-hidden className="inline-block h-0.5 w-4 rounded" style={{ background: colour }} />}
                        {s.name}
                      </span>
                      {s.notes && <span className="mt-0.5 block text-xs text-muted">{s.notes}</span>}
                    </span>
                  </label>
                  <ul className="mt-3 flex flex-1 flex-col gap-1 px-4 pl-11 text-[13px] text-ink-soft">
                    {lines.slice(0, 4).map((l) => <li key={l}>{l}</li>)}
                    {lines.length > 4 && <li className="text-xs text-muted">and {lines.length - 4} more</li>}
                  </ul>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line px-4 py-2">
                    <span className="text-xs text-faint">{author ? `${author}, ` : ""}{formatDate(s.updatedAt.slice(0, 10))}</span>
                    {editable && (
                      <span className="flex gap-0.5">
                        <Button size="sm" variant="ghost" onClick={() => setApplying(s)} title="Copy these changes into the plan">Make it the plan</Button>
                        <Button size="sm" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><Pencil size={14} /></Button>
                        <Button size="sm" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => setRemoving(s)} className="text-muted hover:text-danger"><Trash2 size={14} /></Button>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <h2 className="mt-8 mb-3 text-[15px] font-semibold text-ink">
            {chosen.length ? `Plan compared with ${chosen.length === 1 ? "1 scenario" : `${chosen.length} scenarios`}` : "Tick a scenario above to compare it with the plan"}
          </h2>
          {sampleFigures && (
            <div role="note" className="mb-4 flex gap-3 rounded-md border border-warn/25 bg-warn-50 px-4 py-3 text-[13px] text-ink-soft">
              <Info size={16} className="mt-0.5 shrink-0 text-warn" />
              <p>
                <span className="font-medium text-warn">Sample figures, not calculated.</span> Only the two ready-made Sharma scenarios have figures; new scenarios show what was changed now and their results once the engine is connected in Phase 1B.
              </p>
            </div>
          )}
          {chosen.length > 0 && <CompareView columns={columns} members={family} goals={goals} firm={firmAssumptions} plan={plan} />}
        </>
      )}

      {editing && (
        <ScenarioEditor
          clientId={id}
          members={family}
          scenario={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(sid) => {
            setEditing(null);
            setSelected((cur) => {
              const list = cur ?? chosen;
              return list.includes(sid) ? list : [...list, sid].slice(-MAX_COMPARE);
            });
          }}
        />
      )}

      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Delete "${removing?.name ?? ""}"?`}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Keep</Button><Button variant="danger" onClick={() => { removeScenario(removing!.id); setRemoving(null); }}>Delete scenario</Button></>}
      >
        <p className="text-sm text-ink-soft">The plan isn&apos;t affected. Only this saved what-if is removed.</p>
      </Dialog>

      <Dialog
        open={!!applying}
        onClose={() => setApplying(null)}
        title={`Make "${applying?.name ?? ""}" the plan?`}
        description="These changes are copied into the client's plan. The scenario stays saved."
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplying(null)}>Cancel</Button>
            <Button onClick={() => { applyScenario(applying!.id); setApplied(applying!.name); setApplying(null); }}>Make it the plan</Button>
          </>
        }
      >
        {applying && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {describeChanges(applying.changes, family, goals).map((l) => <li key={l}>{l}</li>)}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">Goals left out in the scenario are removed from the plan, with their reservations.</p>
      </Dialog>
    </>
  );
}
