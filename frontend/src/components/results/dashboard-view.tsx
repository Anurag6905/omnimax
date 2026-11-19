"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { GOAL_TYPE_LABEL } from "@/data/sheet-lists";
import { formatINR, formatINRShort } from "@/lib/format";
import { allocationByClass, summariseGoals } from "@/lib/results";
import { axisMoney, axisTick, ChartTooltip, retirementLabel, ResultPanel, VIZ } from "./chart-kit";
import { GoalBar } from "./goal-bar";
import type { ResultsViewProps } from "./types";

/** One-page summary for client meetings. */
export function DashboardView({ results, goals, assets, retirements }: ResultsViewProps) {
  const summary = summariseGoals(results, goals);
  const fully = summary.filter((s) => s.shortfall < 1).length;
  const nw = results.netWorth.map((r) => ({ year: r.year, value: r.assets - r.liabilities }));
  const today = nw[0];
  const mainRet = retirements[0];
  const atRet = mainRet ? nw.find((r) => r.year === mainRet.year) : undefined;
  const biggest = [...summary].sort((a, b) => b.shortfall - a.shortfall)[0];
  const alloc = allocationByClass(results, assets, results.startYear);
  const allocTotal = alloc.reduce((s, a) => s + a.value, 0);
  const soon = results.goals.filter((g) => g.year < results.startYear + 6).sort((a, b) => a.year - b.year);

  const tiles = [
    { label: `Net worth, ${today.year}`, value: formatINRShort(today.value) },
    mainRet && atRet ? { label: `Net worth at ${mainRet.name}'s retirement, ${mainRet.year}`, value: formatINRShort(atRet.value) } : undefined,
    { label: "Goals fully funded", value: `${fully} of ${summary.length}` },
    biggest && biggest.shortfall > 0
      ? { label: "Largest shortfall", value: formatINRShort(biggest.shortfall), sub: `${biggest.goal.name}, from ${biggest.shortFrom}` }
      : { label: "Shortfall", value: "None" },
  ].filter(Boolean) as Array<{ label: string; value: string; sub?: string }>;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white px-5 py-4">
            <dt className="text-xs text-muted">{t.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-ink">{t.value}</dd>
            {t.sub && <dd className="text-xs text-muted">{t.sub}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <ResultPanel title="Goal funding" note="Share of each goal's total cost covered, in funding order.">
          <ul className="divide-y divide-line">
            {summary.map((s) => (
              <li key={s.goal.id} className="grid grid-cols-1 items-center gap-x-4 gap-y-1.5 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    <span className="mr-1.5 text-muted">{s.goal.priorityRank}.</span>
                    {s.goal.name}
                  </p>
                  <p className="text-xs text-muted">
                    {GOAL_TYPE_LABEL[s.goal.goalType]}, {s.firstYear === s.lastYear ? s.firstYear : `${s.firstYear}–${s.lastYear}`}
                    {s.shortfall > 0 ? `, ${formatINRShort(s.shortfall)} short from ${s.shortFrom}` : ""}
                  </p>
                </div>
                <GoalBar required={s.required} funded={s.funded} />
              </li>
            ))}
          </ul>
        </ResultPanel>

        <ResultPanel title="Net worth over time" note="Assets minus loans, end of each year. Includes property, which is not sold to pay for goals." className="flex flex-col">
          <div className="h-64 px-2 pt-4 pb-2 xl:h-auto xl:min-h-64 xl:flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={nw} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={VIZ.grid} />
                <XAxis dataKey="year" tick={axisTick} tickLine={false} axisLine={{ stroke: VIZ.grid }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tickFormatter={axisMoney} tick={axisTick} tickLine={false} axisLine={false} width={64} />
                {retirements.map((r, i) => (
                  <ReferenceLine key={r.name} x={r.year} stroke={VIZ.marker} strokeDasharray="3 3" label={retirementLabel(r.name, i)} />
                ))}
                <Tooltip
                  cursor={{ stroke: VIZ.axis, strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip active={active} title={label} rows={payload?.length ? [{ label: "Net worth", value: Number(payload[0].value), color: VIZ.single }] : []} />
                  )}
                />
                <Area type="monotone" animationDuration={500} dataKey="value" stroke={VIZ.single} strokeWidth={2} fill={VIZ.single} fillOpacity={0.12} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ResultPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ResultPanel title={`Goals due by ${results.startYear + 5}`}>
          {soon.length ? (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Year</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Goal</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Needed</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {soon.map((g) => {
                  const goal = goals.find((x) => x.id === g.goalId);
                  const short = g.required - g.funded;
                  return (
                    <tr key={`${g.goalId}-${g.year}`}>
                      <td className="px-5 py-2.5 text-ink-soft">{g.year}</td>
                      <td className="px-5 py-2.5 text-ink">{goal?.name}</td>
                      <td className="px-5 py-2.5 text-right text-ink">{formatINR(g.required)}</td>
                      <td className="px-5 py-2.5">{short < 1 ? <Badge tone="brand">Funded</Badge> : <Badge tone="danger">{formatINRShort(short)} short</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-5 py-5 text-sm text-muted">No goals fall due in the next five years.</p>
          )}
        </ResultPanel>

        <ResultPanel title={`What the family owns, ${results.startYear}`} note="By asset class, including property.">
          <ul className="flex flex-col gap-3 px-5 py-4">
            {alloc.map((a) => {
              const pct = allocTotal ? (a.value / allocTotal) * 100 : 0;
              return (
                <li key={a.assetClass} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-ink-soft">{a.assetClass}</span>
                  <span className="h-2 rounded-full bg-surface">
                    <span className="block h-2 rounded-full" style={{ width: `${Math.max(pct, 1)}%`, background: VIZ.single }} />
                  </span>
                  <span className="w-28 text-right text-ink">
                    {formatINRShort(a.value)} <span className="text-xs text-muted">{pct.toFixed(0)}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </ResultPanel>
      </div>
    </div>
  );
}
