"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { BASIS_LABEL, sourceName } from "@/lib/results";
import type { AllocationRow } from "@omnimax/shared";
import { ResultPanel } from "./chart-kit";
import type { ResultsViewProps } from "./types";

const BASIS_TONE: Record<AllocationRow["basis"], BadgeTone> = {
  surplus: "neutral",
  "reserved-1": "brand",
  "reserved-2": "brand",
  "reserved-3": "brand",
  any: "outline",
};

/** Which investment pays for which goal, each year (problem 4: make it visible). */
export function AllocationView({ results, goals, assets, incomes }: ResultsViewProps) {
  const years = useMemo(() => [...new Set(results.allocations.map((a) => a.year))].sort((a, b) => a - b), [results]);
  const [year, setYear] = useState(years[0]);
  const idx = years.indexOf(year);
  const rows = results.allocations.filter((a) => a.year === year);
  const goalIds = [...new Set(rows.map((r) => r.goalId))].sort(
    (a, b) => (goals.find((g) => g.id === a)?.priorityRank ?? 99) - (goals.find((g) => g.id === b)?.priorityRank ?? 99),
  );
  const needs = results.goals.filter((g) => g.year === year);

  const sources = useMemo(() => {
    const ids = [...new Set(results.investments.map((i) => i.sourceId))];
    return ids.filter((id) => results.investments.some((i) => i.sourceId === id && (i.withdrawals > 0 || i.endValue > 0)));
  }, [results]);
  const firstUsed = results.allocations.find((a) => a.sourceId !== "surplus")?.sourceId;
  const [ledger, setLedger] = useState(firstUsed ?? sources[0]);
  const ledgerRows = results.investments.filter((i) => i.sourceId === ledger);

  return (
    <div className="flex flex-col gap-6">
      <ResultPanel
        title={`Who pays for what in ${year}`}
        note="Each goal due this year, the investments it was paid from, and why each was picked."
        actions={
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" aria-label="Previous year with payments" disabled={idx <= 0} onClick={() => setYear(years[idx - 1])}><ChevronLeft size={16} /></Button>
            <Select aria-label="Year" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Button size="sm" variant="ghost" aria-label="Next year with payments" disabled={idx >= years.length - 1} onClick={() => setYear(years[idx + 1])}><ChevronRight size={16} /></Button>
          </div>
        }
      >
        <ul className="divide-y divide-line">
          {goalIds.map((gid) => {
            const goal = goals.find((g) => g.id === gid);
            const need = needs.find((n) => n.goalId === gid);
            const paid = rows.filter((r) => r.goalId === gid);
            const short = need ? need.required - need.funded : 0;
            return (
              <li key={gid} className="grid gap-x-6 gap-y-2 px-5 py-4 lg:grid-cols-[260px_1fr]">
                <div>
                  <p className="text-sm font-medium text-ink"><span className="mr-1.5 text-muted">{goal?.priorityRank}.</span>{goal?.name}</p>
                  <p className="text-xs text-muted">Needs {formatINR(need?.required)}{short >= 1 ? `, ${formatINR(short)} still short` : ", fully paid"}</p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {paid.map((p, i) => (
                    <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_200px_120px]">
                      <span className="truncate text-sm text-ink">{sourceName(p.sourceId, assets, incomes)}</span>
                      <span className="hidden sm:block"><Badge tone={BASIS_TONE[p.basis]}>{BASIS_LABEL[p.basis]}</Badge></span>
                      <span className="text-right text-sm font-medium text-ink">{formatINR(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-5 py-2.5 text-xs text-muted">
          Order used: {Object.values(BASIS_LABEL).join(" → ")}. Investments reserved for another goal are kept for that goal. The final engine follows the 8 levels in Input_Allocations.py.
        </p>
      </ResultPanel>

      <ResultPanel
        title="Investment ledger"
        note="One investment, year by year: the same columns as the Omnimax output."
        actions={
          <Field label="Investment" className="w-72">
            {(id) => (
              <Select id={id} value={ledger} onChange={(e) => setLedger(e.target.value)}>
                {sources.map((s) => <option key={s} value={s}>{sourceName(s, assets, incomes)}</option>)}
              </Select>
            )}
          </Field>
        }
      >
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Year</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Start value</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Contributions</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Earnings</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Withdrawals</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">End value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ledgerRows.map((r) => (
                <tr key={r.year} className={cn(r.withdrawals > 0 && "bg-warn-50/50")}>
                  <td className="px-5 py-2 text-ink">{r.year}</td>
                  <td className="px-4 py-2 text-right text-ink-soft">{formatINR(r.startValue)}</td>
                  <td className="px-4 py-2 text-right text-ink-soft">{r.contributions ? formatINR(r.contributions) : "–"}</td>
                  <td className="px-4 py-2 text-right text-ink-soft">{formatINR(r.earnings)}</td>
                  <td className={cn("px-4 py-2 text-right", r.withdrawals > 0 ? "font-medium text-ink" : "text-faint")}>{r.withdrawals > 0 ? formatINR(r.withdrawals) : "–"}</td>
                  <td className="px-5 py-2 text-right font-medium text-ink">{formatINR(r.endValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-2.5 text-xs text-muted">Years with withdrawals are highlighted.</p>
      </ResultPanel>
    </div>
  );
}
