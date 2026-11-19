"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR, formatINRShort } from "@/lib/format";
import { allocationByClass } from "@/lib/results";
import { axisMoney, axisTick, ChartTooltip, retirementLabel, ResultPanel, VIZ } from "./chart-kit";
import type { ResultsViewProps } from "./types";

/** Net worth over time and what it is made of at key years. */
export function NetWorthView({ results, assets, retirements }: ResultsViewProps) {
  const data = results.netWorth.map((r) => ({ ...r, net: r.assets - r.liabilities }));
  const marks = [
    { label: `Today, ${results.startYear}`, year: results.startYear },
    ...retirements.slice(0, 1).map((r) => ({ label: `${r.name} retires, ${r.year}`, year: r.year })),
    { label: `Plan ends, ${results.endYear}`, year: results.endYear },
  ];
  const tableYears = data.filter((d, i) => i === 0 || d.year % 5 === 0 || d.year === results.endYear || retirements.some((r) => r.year === d.year));

  return (
    <div className="flex flex-col gap-6">
      <ResultPanel title="Net worth" note="Everything the family owns minus loans outstanding, end of each year. Property is included but is not sold to pay for goals, so net worth can rise while a goal falls short.">
        <div className="h-72 px-2 pt-4 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
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
                    <ChartTooltip active={active} title={label} rows={row ? [
                      { label: "Net worth", value: row.net, color: VIZ.single },
                      { label: "Assets", value: row.assets },
                      { label: "Loans", value: row.liabilities },
                    ] : []} />
                  );
                }}
              />
              <Area type="monotone" animationDuration={500} dataKey="net" stroke={VIZ.single} strokeWidth={2} fill={VIZ.single} fillOpacity={0.12} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ResultPanel>

      <ResultPanel title="Asset allocation" note="Grouped by asset class, using the proposed mapping on the Firm assumptions page.">
        <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {marks.map((m) => {
            const rows = allocationByClass(results, assets, m.year);
            const total = rows.reduce((s, r) => s + r.value, 0);
            return (
              <div key={m.label} className="px-5 py-4">
                <p className="text-sm font-medium text-ink">{m.label}</p>
                <p className="mb-3 text-xs text-muted">Total {formatINRShort(total)}</p>
                <ul className="flex flex-col gap-2.5">
                  {rows.map((r) => {
                    const pct = total ? (r.value / total) * 100 : 0;
                    return (
                      <li key={r.assetClass} className="text-[13px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-ink-soft">{r.assetClass}</span>
                          <span className="text-ink">{pct.toFixed(0)}% <span className="text-xs text-muted">{formatINRShort(r.value)}</span></span>
                        </div>
                        <span className="mt-1 block h-1.5 rounded-full bg-surface">
                          <span className="block h-1.5 rounded-full" style={{ width: `${Math.max(pct, 1)}%`, background: VIZ.single }} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </ResultPanel>

      <ResultPanel title="Key years">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Year</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Assets</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Loans</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Net worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tableYears.map((d) => (
                <tr key={d.year}>
                  <td className="px-5 py-2 text-ink">{d.year}{retirements.filter((r) => r.year === d.year).map((r) => <span key={r.name} className="ml-2 text-xs text-brand">{r.name} retires</span>)}</td>
                  <td className="px-4 py-2 text-right text-ink-soft">{formatINR(d.assets)}</td>
                  <td className="px-4 py-2 text-right text-ink-soft">{d.liabilities ? formatINR(d.liabilities) : "–"}</td>
                  <td className="px-5 py-2 text-right font-medium text-ink">{formatINR(d.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResultPanel>
    </div>
  );
}
