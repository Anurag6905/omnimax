"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { InflationKey } from "@omnimax/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form";
import { INFLATION_LABEL } from "@/data/assumption-defaults";
import type { EffectiveInflation } from "@/lib/assumptions";

interface Props {
  rows: EffectiveInflation[];
  editable: boolean;
  mode: "firm" | "plan";
  /** plan mode: firm rates, shown as placeholders */
  firmRates?: Partial<Record<InflationKey, number>>;
  /** plan mode: values set for this plan only (blank = firm default) */
  planRates?: Partial<Record<InflationKey, number>>;
  onSave: (rates: Partial<Record<InflationKey, number>>) => void;
}

/** Inflation by goal type (problem 9: one rate for every goal). */
export function InflationPanel({ rows, editable, mode, firmRates, planRates, onSave }: Props) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string>();

  function start() {
    setError(undefined);
    const source = mode === "firm" ? Object.fromEntries(rows.map((r) => [r.key, r.ratePct])) : planRates ?? {};
    setDraft(Object.fromEntries(rows.map((r) => [r.key, source[r.key]?.toString() ?? ""])));
  }

  function save() {
    if (!draft) return;
    const out: Partial<Record<InflationKey, number>> = {};
    for (const r of rows) {
      const raw = draft[r.key]?.trim();
      if (!raw) {
        if (mode === "firm") return setError(`Enter a rate for ${INFLATION_LABEL[r.key].toLowerCase()}.`);
        continue;
      }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > 50) return setError(`${INFLATION_LABEL[r.key]}: enter a rate from 0 to 50%.`);
      out[r.key] = n;
    }
    onSave(out);
    setDraft(null);
  }

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Inflation by goal type</h3>
          <p className="mt-0.5 text-xs text-muted">
            {mode === "plan" ? "Leave a rate blank to use the firm default. A rate set on a single goal (Goals tab) wins over these." : "Defaults for every new plan."}
          </p>
        </div>
        {editable && !draft && <Button size="sm" variant="secondary" onClick={start}><Pencil size={14} /> {mode === "plan" ? "Change for this plan" : "Edit rates"}</Button>}
        {draft && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save rates</Button>
          </div>
        )}
      </div>
      {error && <p role="alert" className="mx-5 mt-3 rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface text-xs text-muted">
          <tr>
            <th scope="col" className="px-5 py-2.5 font-medium">Applies to</th>
            <th scope="col" className="w-44 px-5 py-2.5 text-right font-medium">Inflation a year</th>
            {mode === "plan" && <th scope="col" className="w-36 px-5 py-2.5 font-medium">Set by</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="px-5 py-2.5 text-ink">{INFLATION_LABEL[r.key]}</td>
              <td className="px-5 py-1.5 text-right">
                {draft ? (
                  <div className="relative ml-auto w-28">
                    <Input
                      aria-label={`${INFLATION_LABEL[r.key]} inflation`}
                      inputMode="decimal"
                      value={draft[r.key]}
                      placeholder={mode === "plan" ? String(firmRates?.[r.key] ?? "") : undefined}
                      onChange={(e) => setDraft((d) => ({ ...d!, [r.key]: e.target.value }))}
                      className="h-8 pr-7 text-right"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-faint">%</span>
                  </div>
                ) : (
                  <span className="font-medium text-ink">{r.ratePct != null ? `${r.ratePct}%` : "–"}</span>
                )}
              </td>
              {mode === "plan" && (
                <td className="px-5 py-2.5">{r.source === "plan" ? <Badge tone="brand">This plan</Badge> : <Badge tone="outline">Firm default</Badge>}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
