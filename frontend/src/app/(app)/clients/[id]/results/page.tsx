"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BarChart3, ChevronRight, Info } from "lucide-react";
import { useVisibleClients } from "@/components/clients/shared";
import { DashboardView } from "@/components/results/dashboard-view";
import { CashflowView } from "@/components/results/cashflow-view";
import { GoalsView } from "@/components/results/goals-view";
import { AllocationView } from "@/components/results/allocation-view";
import { NetWorthView } from "@/components/results/networth-view";
import type { ResultsViewProps } from "@/components/results/types";
import { useClientRecords, useClientStore } from "@/lib/store";
import { getResults } from "@/lib/results";
import { useHashTab } from "@/lib/use-hash-tab";
import { yearAtAge } from "@/lib/format";
import { cn } from "@/lib/cn";

const VIEWS: Array<{ key: string; label: string; View: (p: ResultsViewProps) => React.ReactNode }> = [
  { key: "dashboard", label: "Dashboard", View: DashboardView },
  { key: "cashflow", label: "Cash flow", View: CashflowView },
  { key: "goals", label: "Goal funding", View: GoalsView },
  { key: "allocation", label: "Who pays for what", View: AllocationView },
  { key: "networth", label: "Net worth", View: NetWorthView },
];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const client = useVisibleClients().find((c) => c.id === id);
  const { members } = useClientStore();
  const goals = useClientRecords("goals", id);
  const assets = useClientRecords("assets", id);
  const incomes = useClientRecords("incomes", id);
  const [tab, setTab] = useHashTab(VIEWS.map((v) => v.key));

  if (!client) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="font-medium text-ink">This client isn&apos;t in your list</p>
        <Link href="/clients" className="mt-4 text-sm font-medium text-brand hover:underline">Back to clients</Link>
      </div>
    );
  }

  const family = members.filter((m) => m.clientId === id).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
  const retirements = family
    .map((m) => ({ name: m.fullName.split(" ")[0], year: yearAtAge(m.dateOfBirth, m.retirementAge) }))
    .filter((r): r is { name: string; year: number } => r.year != null && r.year >= new Date().getFullYear())
    .sort((a, b) => a.year - b.year);
  const results = getResults(id);
  const Active = VIEWS.find((v) => v.key === tab)!.View;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-[13px] text-muted">
        <Link href="/clients" className="hover:text-ink">Clients</Link>
        <ChevronRight size={14} />
        <Link href={`/clients/${id}`} className="hover:text-ink">{client.householdName}</Link>
        <ChevronRight size={14} />
        <span className="text-ink-soft">Plan results</span>
      </nav>

      <header className="pb-5">
        <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.01em] text-ink">Plan results</h1>
        <p className="mt-1 text-sm text-muted">
          {client.householdName}
          {results && `, ${results.startYear} to ${results.endYear}`}
        </p>
      </header>

      {!results ? (
        <div className="flex flex-col items-center rounded-lg border border-line px-6 py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface text-muted"><BarChart3 size={18} /></span>
          <p className="mt-3 font-medium text-ink">No results for this client yet</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Results come from the calculation engine, which arrives in Phase 1B. Until then, sample results exist for the Sharma family only.
          </p>
          <Link href="/clients/c-1/results" className="mt-4 text-sm font-medium text-brand hover:underline">See the Sharma family&apos;s sample results</Link>
        </div>
      ) : (
        <>
          {results.illustrative && (
            <div role="note" className="mb-5 flex gap-3 rounded-md border border-warn/25 bg-warn-50 px-4 py-3 text-[13px] text-ink-soft">
              <Info size={16} className="mt-0.5 shrink-0 text-warn" />
              <p>
                <span className="font-medium text-warn">Sample figures for reviewing the screens, not calculated.</span> They were made once from this family&apos;s
                sample inputs and won&apos;t change if you edit the profile. Real results come from the calculation engine in Phase 1B, checked against Omnimax.
              </p>
            </div>
          )}

          <div className="border-b border-line">
            <div role="tablist" aria-label="Plan results" className="-mb-px flex gap-6 overflow-x-auto">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  role="tab"
                  id={`rtab-${v.key}`}
                  aria-selected={tab === v.key}
                  aria-controls="results-panel"
                  onClick={() => setTab(v.key)}
                  className={cn(
                    "border-b-2 pb-2.5 text-sm whitespace-nowrap transition-colors",
                    tab === v.key ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <section id="results-panel" role="tabpanel" aria-labelledby={`rtab-${tab}`} className="pt-6">
            <Active results={results} goals={goals} assets={assets} incomes={incomes} members={family} retirements={retirements} />
          </section>
        </>
      )}
    </>
  );
}
