"use client";

import { Fragment, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GOAL_TYPE_LABEL } from "@/data/sheet-lists";
import { formatINR, formatINRShort } from "@/lib/format";
import { BASIS_LABEL, sourceName, summariseGoals } from "@/lib/results";
import { axisMoney, axisTick, ChartTooltip, Legend, ResultPanel, VIZ } from "./chart-kit";
import { GoalBar } from "./goal-bar";
import type { ResultsViewProps } from "./types";

/** Which goals are fully funded and which fall short, and when. */
export function GoalsView({ results, goals, assets, incomes }: ResultsViewProps) {
  const summary = summariseGoals(results, goals);
  const [open, setOpen] = useState<string | null>(null);

  // all goals together, per year
  const byYear = new Map<number, { year: number; funded: number; shortfall: number }>();
  for (const g of results.goals) {
    const row = byYear.get(g.year) ?? { year: g.year, funded: 0, shortfall: 0 };
    row.funded += g.funded;
    row.shortfall += Math.max(0, g.required - g.funded);
    byYear.set(g.year, row);
  }
  const yearly = [...byYear.values()].sort((a, b) => a.year - b.year);

  return (
    <div className="flex flex-col gap-6">
      <ResultPanel
        title="Every goal, year by year"
        note="Each bar is what all goals need that year: the funded part and the shortfall."
        actions={<Legend items={[{ label: "Funded", color: VIZ.funded }, { label: "Shortfall", color: VIZ.shortfall }]} />}
      >
        <div className="h-64 px-2 pt-4 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearly} margin={{ top: 8, right: 16, left: 4, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={VIZ.grid} />
              <XAxis dataKey="year" tick={axisTick} tickLine={false} axisLine={{ stroke: VIZ.grid }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tickFormatter={axisMoney} tick={axisTick} tickLine={false} axisLine={false} width={64} />
              <Tooltip
                cursor={{ fill: "rgba(20,33,61,0.05)" }}
                content={({ active, payload, label }) => {
                  const row = payload?.[0]?.payload as (typeof yearly)[number] | undefined;
                  return (
                    <ChartTooltip active={active} title={label} rows={row ? [
                      { label: "Funded", value: row.funded, color: VIZ.funded },
                      { label: "Shortfall", value: row.shortfall, color: VIZ.shortfall },
                    ] : []} />
                  );
                }}
              />
              <Bar dataKey="funded" stackId="g" fill={VIZ.funded} stroke="#fff" strokeWidth={1} />
              <Bar dataKey="shortfall" stackId="g" fill={VIZ.shortfall} stroke="#fff" strokeWidth={1} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ResultPanel>

      <ResultPanel title="Goal by goal" note="In funding order. Open a goal to see each year and which investments paid for it.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="w-10 px-3 py-2.5"><span className="sr-only">Open</span></th>
                <th scope="col" className="px-3 py-2.5 font-medium">Goal</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Years</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Needed</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Funded</th>
                <th scope="col" className="w-56 px-4 py-2.5 font-medium">Covered</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {summary.map((s) => {
                const isOpen = open === s.goal.id;
                const years = results.goals.filter((g) => g.goalId === s.goal.id);
                return (
                  <Fragment key={s.goal.id}>
                    <tr className="cursor-pointer hover:bg-surface/50" onClick={() => setOpen(isOpen ? null : s.goal.id)}>
                      <td className="px-3 py-3">
                        <button aria-expanded={isOpen} aria-label={`${isOpen ? "Close" : "Open"} ${s.goal.name}`} className="rounded p-0.5 text-muted hover:text-ink">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-ink"><span className="mr-1.5 text-muted">{s.goal.priorityRank}.</span>{s.goal.name}</p>
                        <p className="text-xs text-muted">{GOAL_TYPE_LABEL[s.goal.goalType]}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{s.firstYear === s.lastYear ? s.firstYear : `${s.firstYear}–${s.lastYear}`}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{formatINR(s.required)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{formatINR(s.funded)}</td>
                      <td className="px-4 py-3"><GoalBar required={s.required} funded={s.funded} /></td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {s.shortfall < 1 ? <Badge tone="brand">Fully funded</Badge> : <Badge tone="danger">{formatINRShort(s.shortfall)} short from {s.shortFrom}</Badge>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-surface/40">
                        <td />
                        <td colSpan={6} className="px-3 pt-1 pb-4">
                          <table className="w-full text-[13px]">
                            <thead className="text-xs text-muted">
                              <tr>
                                <th scope="col" className="py-1.5 pr-4 text-left font-medium">Year</th>
                                <th scope="col" className="py-1.5 pr-4 text-right font-medium">Needed</th>
                                <th scope="col" className="py-1.5 pr-4 text-right font-medium">Funded</th>
                                <th scope="col" className="py-1.5 pr-4 text-right font-medium">Short</th>
                                <th scope="col" className="py-1.5 text-left font-medium">Paid from</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line/70">
                              {years.map((y) => {
                                const paid = results.allocations.filter((a) => a.goalId === s.goal.id && a.year === y.year);
                                const short = y.required - y.funded;
                                return (
                                  <tr key={y.year}>
                                    <td className="py-1.5 pr-4 text-ink">{y.year}</td>
                                    <td className="py-1.5 pr-4 text-right text-ink">{formatINR(y.required)}</td>
                                    <td className="py-1.5 pr-4 text-right text-ink">{formatINR(y.funded)}</td>
                                    <td className={short >= 1 ? "py-1.5 pr-4 text-right font-medium text-danger" : "py-1.5 pr-4 text-right text-faint"}>{short >= 1 ? formatINR(short) : "–"}</td>
                                    <td className="py-1.5 text-ink-soft">
                                      {paid.length
                                        ? paid.map((p) => `${sourceName(p.sourceId, assets, incomes)} ${formatINRShort(p.amount)}`).join(", ")
                                        : <span className="text-faint">Nothing available</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <p className="mt-2 text-xs text-muted">Order used: {Object.values(BASIS_LABEL).join(" → ")}.</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </ResultPanel>
    </div>
  );
}
