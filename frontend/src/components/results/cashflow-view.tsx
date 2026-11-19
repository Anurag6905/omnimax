"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { axisMoney, axisTick, ChartTooltip, retirementLabel, Legend, ResultPanel, VIZ } from "./chart-kit";
import type { ResultsViewProps } from "./types";

/** Year-by-year cash flow: income in, spending and investing out. */
export function CashflowView({ results, members, retirements }: ResultsViewProps) {
  const [every5, setEvery5] = useState(false);
  const data = results.cashflow.map((c) => ({ ...c, outflow: c.expenses + c.loanEmi + c.investing }));
  const retireYears = new Set(retirements.map((r) => r.year));
  const shown = every5 ? data.filter((c, i) => i === 0 || c.year % 5 === 0 || retireYears.has(c.year)) : data;
  const people = members.filter((m) => results.cashflow.some((c) => c.ages[m.id] != null)).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <ResultPanel
        title="Money in and money out"
        note="Money out = household expenses + loan EMIs + new investing. From retirement, living costs are paid as the retirement goal (Goal funding)."
        actions={<Legend items={[{ label: "Income", color: VIZ.income }, { label: "Money out", color: VIZ.outflow }, { label: "Retirement", color: VIZ.marker, dashed: true }]} />}
      >
        <div className="h-72 px-2 pt-4 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={VIZ.grid} />
              <XAxis dataKey="year" tick={axisTick} tickLine={false} axisLine={{ stroke: VIZ.grid }} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickFormatter={axisMoney} tick={axisTick} tickLine={false} axisLine={false} width={64} />
              {retirements.map((r, i) => (
                <ReferenceLine key={r.name} x={r.year} stroke={VIZ.marker} strokeDasharray="3 3" label={retirementLabel(r.name, i)} />
              ))}
              <Tooltip
                cursor={{ stroke: VIZ.axis, strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  return (
                    <ChartTooltip
                      active={active}
                      title={label}
                      rows={row ? [
                        { label: "Income", value: row.income, color: VIZ.income },
                        { label: "Money out", value: row.outflow, color: VIZ.outflow },
                        { label: "Surplus", value: row.surplus },
                      ] : []}
                    />
                  );
                }}
              />
              <Line type="linear" dataKey="income" animationDuration={500} stroke={VIZ.income} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="linear" dataKey="outflow" animationDuration={500} stroke={VIZ.outflow} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ResultPanel>

      <ResultPanel
        title="Year by year"
        note="Retirement years are highlighted."
        actions={
          <Button size="sm" variant="secondary" onClick={() => setEvery5((v) => !v)}>
            {every5 ? "Show every year" : "Show every 5 years"}
          </Button>
        }
      >
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Year</th>
                {people.map((m) => (
                  <th key={m.id} scope="col" className="px-3 py-2.5 text-right font-medium">{m.fullName.split(" ")[0]}&apos;s age</th>
                ))}
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Income</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Expenses</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Loan EMIs</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Investing</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Surplus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((c) => {
                const ret = retirements.filter((r) => r.year === c.year);
                return (
                  <tr key={c.year} className={cn(ret.length > 0 && "bg-brand-50/60")}>
                    <td className="whitespace-nowrap px-5 py-2 font-medium text-ink">
                      {c.year}
                      {ret.map((r) => <span key={r.name} className="ml-2 text-xs font-normal text-brand">{r.name} retires</span>)}
                    </td>
                    {people.map((m) => (
                      <td key={m.id} className="px-3 py-2 text-right text-muted">{c.ages[m.id] ?? "–"}</td>
                    ))}
                    <td className="px-4 py-2 text-right text-ink">{formatINR(c.income)}</td>
                    <td className="px-4 py-2 text-right text-ink-soft">{c.expenses ? formatINR(c.expenses) : "–"}</td>
                    <td className="px-4 py-2 text-right text-ink-soft">{c.loanEmi ? formatINR(c.loanEmi) : "–"}</td>
                    <td className="px-4 py-2 text-right text-ink-soft">{c.investing ? formatINR(c.investing) : "–"}</td>
                    <td className={cn("px-5 py-2 text-right font-medium", c.surplus < 0 ? "text-danger" : "text-ink")}>{formatINR(c.surplus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ResultPanel>
    </div>
  );
}
