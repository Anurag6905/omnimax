"use client";

import { useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { ReturnAssumption } from "@omnimax/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { describePeriods, type EffectiveReturn } from "@/lib/assumptions";
import { PeriodsDialog } from "./periods-dialog";

interface Props {
  rows: EffectiveReturn[];
  /** who the "retirement" boundary refers to */
  retirement: { year?: number; name?: string };
  editable: boolean;
  /** "firm": edit the defaults; "plan": override per client */
  mode: "firm" | "plan";
  onSave: (value: ReturnAssumption) => void;
  /** firm: delete an asset class; plan: go back to the firm default */
  onReset?: (assetClass: string) => void;
}

/** Returns by asset class over time: "12% until 2041, then 8%". */
export function ReturnsPanel({ rows, retirement, editable, mode, onSave, onReset }: Props) {
  const [editing, setEditing] = useState<ReturnAssumption | "new" | null>(null);
  const retirementLabel =
    mode === "firm"
      ? "The main client's retirement"
      : `${retirement.name ? `${retirement.name}'s` : "The main client's"} retirement${retirement.year ? ` (${retirement.year})` : ""}`;

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Expected returns by asset class</h3>
          <p className="mt-0.5 text-xs text-muted">
            Set once here instead of on every investment. A period can end in a set year or at retirement; one that ends at retirement moves when the retirement age changes.
          </p>
        </div>
        {editable && mode === "firm" && (
          <Button size="sm" variant="secondary" onClick={() => setEditing("new")}><Plus size={14} /> Add asset class</Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              <th scope="col" className="px-5 py-2.5 font-medium">Asset class</th>
              <th scope="col" className="px-5 py-2.5 font-medium">Return over time</th>
              {mode === "plan" && <th scope="col" className="px-5 py-2.5 font-medium">Set by</th>}
              {editable && <th scope="col" className="px-3 py-2.5"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.assetClass}>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-ink">{r.assetClass}</td>
                <td className="px-5 py-3">
                  <PeriodBar periods={r.periods} />
                  <p className="mt-1.5 text-[13px] text-ink-soft">{describePeriods(r.periods, mode === "plan" ? retirement : undefined)}</p>
                </td>
                {mode === "plan" && (
                  <td className="px-5 py-3">{r.source === "plan" ? <Badge tone="brand">This plan</Badge> : <Badge tone="outline">Firm default</Badge>}</td>
                )}
                {editable && (
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                        <Pencil size={14} /> {mode === "plan" && r.source === "firm" ? "Change for this plan" : "Edit"}
                      </Button>
                      {onReset && mode === "plan" && r.source === "plan" && (
                        <Button variant="ghost" size="sm" onClick={() => onReset(r.assetClass)} title="Use the firm default again">
                          <RotateCcw size={14} /> Use firm default
                        </Button>
                      )}
                      {onReset && mode === "firm" && (
                        <Button variant="ghost" size="sm" aria-label={`Remove ${r.assetClass}`} onClick={() => onReset(r.assetClass)} className="text-muted hover:text-danger">
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
      </div>
      {editing && (
        <PeriodsDialog
          value={editing === "new" ? undefined : editing}
          retirementLabel={retirementLabel}
          existing={rows.map((r) => r.assetClass)}
          onSave={(v) => { onSave(v); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

/** The periods as a strip in time order: darker for the first period, lighter for later ones. */
function PeriodBar({ periods }: { periods: EffectiveReturn["periods"] }) {
  return (
    <div aria-hidden className="flex h-2 max-w-md gap-0.5">
      {periods.map((p, i) => (
        <div key={i} className={i === 0 ? "flex-1 rounded-full bg-brand" : "flex-1 rounded-full bg-brand/40"} title={`${p.ratePct}%`} />
      ))}
    </div>
  );
}
