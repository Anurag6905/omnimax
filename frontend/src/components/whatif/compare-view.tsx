"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AssumptionSet, FamilyMember, Goal, PlanResults, Scenario } from "@omnimax/shared";
import { ChartTooltip, ResultPanel, axisMoney, axisTick, VIZ } from "@/components/results/chart-kit";
import { INFLATION_KEYS, INFLATION_LABEL } from "@/data/assumption-defaults";
import { describePeriods, effectiveInflation, effectiveReturns } from "@/lib/assumptions";
import { headline, membersUnder, shortfallByYear, type Headline } from "@/lib/scenarios";
import { formatINRShort, yearAtAge } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Line colours, validated: blue / orange / aqua pass colour-blind checks; aqua is
 *  lighter on white, so the table below doubles as the labelled view. */
export const COMPARE_COLOURS = ["#2a78d6", "#eb6834", "#1baf7a"] as const;
const DASHES = ["0", "6 3", "2 3"] as const;

export interface Column {
  key: string;
  name: string;
  scenario?: Scenario;
  results?: PlanResults;
}

interface Props {
  columns: Column[];
  members: FamilyMember[];
  goals: Goal[];
  firm: AssumptionSet;
  plan?: AssumptionSet;
}

type Better = "higher" | "lower" | "later";

/** Plan vs up to two scenarios: what was changed, then what it does to the plan. */
export function CompareView({ columns, members, goals, firm, plan }: Props) {
  const base = columns[0];
  const anyResults = columns.some((c) => c.results);

  // per column: members, retirement year of the main client, and headline figures
  const cols = columns.map((c) => {
    const ms = membersUnder(members, c.scenario?.changes ?? {});
    const main = ms.find((m) => m.isPrimary);
    const retYear = yearAtAge(main?.dateOfBirth, main?.retirementAge);
    const goalsIn = goals.filter((g) => c.scenario?.changes.goals?.[g.id]?.include !== false);
    return { ...c, members: ms, retYear, h: c.results ? headline(c.results, goalsIn, retYear) : undefined };
  });

  // input rows: retirement ages always; returns/inflation/goals only where a scenario changes them
  const people = members.filter((m) => m.retirementAge != null);
  const changedClasses = [...new Set(columns.flatMap((c) => c.scenario?.changes.returns?.map((r) => r.assetClass) ?? []))];
  const changedInflation = INFLATION_KEYS.filter((k) => columns.some((c) => c.scenario?.changes.inflation?.[k] != null));
  const changedGoals = goals.filter((g) => columns.some((c) => c.scenario?.changes.goals?.[g.id]));
  const planReturns = effectiveReturns(firm, plan);
  const planInflation = effectiveInflation(firm, plan);

  const returnFor = (c: (typeof cols)[number], cls: string) => {
    const r = c.scenario?.changes.returns?.find((x) => x.assetClass === cls) ?? planReturns.find((x) => x.assetClass === cls);
    return r ? describePeriods(r.periods) : "–";
  };

  // chart: shortfall of all goals together, per year, one line per column with results
  const series = cols.filter((c) => c.results).map((c) => ({ key: c.key, name: c.name, data: shortfallByYear(c.results!) }));
  const years = base.results ? base.results.cashflow.map((r) => r.year) : [];
  const chart = years.map((y) => Object.fromEntries([["year", y], ...series.map((s) => [s.key, s.data.get(y) ?? 0])]));

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface">
              <tr>
                <th scope="col" className="w-64 px-5 py-3 text-xs font-medium text-muted">Compared</th>
                {cols.map((c, i) => (
                  <th key={c.key} scope="col" className="px-5 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span aria-hidden className="inline-block h-0.5 w-5 rounded" style={{ background: COMPARE_COLOURS[i] }} />
                      {c.name}
                    </span>
                    {i === 0 && <span className="block text-xs font-normal text-muted">The plan as it is</span>}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <SectionRow label="What was changed" span={cols.length} />
              {people.map((m) => (
                <Row key={m.id} label={`${m.fullName.split(" ")[0]}'s retirement`}>
                  {cols.map((c, i) => {
                    const cm = c.members.find((x) => x.id === m.id)!;
                    const y = yearAtAge(cm.dateOfBirth, cm.retirementAge);
                    const changed = i > 0 && cm.retirementAge !== m.retirementAge;
                    return <Cell key={c.key} changed={changed}>Age {cm.retirementAge}{y ? `, ${y}` : ""}</Cell>;
                  })}
                </Row>
              ))}
              {changedClasses.map((cls) => (
                <Row key={cls} label={`${cls} return`}>
                  {cols.map((c, i) => <Cell key={c.key} changed={i > 0 && !!c.scenario?.changes.returns?.some((r) => r.assetClass === cls)}>{returnFor(c, cls)}</Cell>)}
                </Row>
              ))}
              {changedInflation.map((k) => (
                <Row key={k} label={`${INFLATION_LABEL[k]} inflation`}>
                  {cols.map((c, i) => {
                    const v = c.scenario?.changes.inflation?.[k] ?? planInflation.find((x) => x.key === k)?.ratePct;
                    return <Cell key={c.key} changed={i > 0 && c.scenario?.changes.inflation?.[k] != null}>{v != null ? `${v}%` : "–"}</Cell>;
                  })}
                </Row>
              ))}
              {changedGoals.map((g) => (
                <Row key={g.id} label={g.name}>
                  {cols.map((c, i) => {
                    const gc = c.scenario?.changes.goals?.[g.id];
                    let text = "As planned";
                    if (gc?.include === false) text = "Left out";
                    else if (gc) {
                      const parts = [
                        gc.costToday != null && formatINRShort(gc.costToday),
                        gc.currentMonthlyExpenses != null && `${formatINRShort(gc.currentMonthlyExpenses)} a month`,
                        gc.startYear != null && `in ${gc.startYear}`,
                        gc.startAge != null && `at age ${gc.startAge}`,
                      ].filter(Boolean);
                      text = parts.join(", ");
                    }
                    return <Cell key={c.key} changed={i > 0 && !!gc}>{i === 0 ? "As planned" : text}</Cell>;
                  })}
                </Row>
              ))}

              <SectionRow label="What it does to the plan" span={cols.length} />
              {!anyResults ? (
                <tr>
                  <td colSpan={cols.length + 1} className="px-5 py-4 text-sm text-muted">
                    Results appear here once the calculation engine is connected (Phase 1B).
                  </td>
                </tr>
              ) : (
                <>
                  <MetricRow label="Goals fully funded" cols={cols} get={(h) => h.fullyFunded} fmt={(v, h) => `${v} of ${h.goalCount}`} better="higher" delta={(d) => `${d > 0 ? "+" : ""}${d}`} />
                  <MetricRow label="Total shortfall" cols={cols} get={(h) => h.totalShortfall} fmt={(v) => (v == null || v < 1 ? "None" : formatINRShort(v))} better="lower" delta={(d) => `${d > 0 ? "+" : "−"}${formatINRShort(Math.abs(d))}`} />
                  <MetricRow label="First year a goal falls short" cols={cols} get={(h) => h.firstShortYear} fmt={(v) => (v == null ? "Never" : String(v))} better="later" delta={(d) => `${d > 0 ? "+" : ""}${d} yrs`} />
                  <MetricRow label="Retirement goal covered" cols={cols} get={(h) => h.retirementFundedPct} fmt={(v) => (v == null ? "–" : `${v.toFixed(0)}%`)} better="higher" delta={(d) => `${d > 0 ? "+" : ""}${d.toFixed(0)} pts`} />
                  <MetricRow label="Net worth at retirement" cols={cols} get={(h) => h.netWorthAtRetirement} fmt={(v) => (v == null ? "–" : formatINRShort(v))} better="higher" delta={(d) => `${d > 0 ? "+" : "−"}${formatINRShort(Math.abs(d))}`} />
                  {goals
                    .filter((g) => cols.some((c) => c.h?.goalPct[g.id] != null))
                    .sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99))
                    .map((g) => (
                      <MetricRow
                        key={g.id}
                        label={`${g.priorityRank}. ${g.name}`}
                        sub
                        cols={cols}
                        get={(h) => h.goalPct[g.id]}
                        fmt={(v) => (v == null ? "Left out" : `${v.toFixed(0)}% covered`)}
                        better="higher"
                        delta={(d) => `${d > 0 ? "+" : ""}${d.toFixed(0)} pts`}
                      />
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        {anyResults && cols.some((c) => !c.results) && (
          <p className="border-t border-line px-5 py-2.5 text-xs text-muted">&quot;After engine&quot;: this scenario&apos;s results are calculated once the engine is connected in Phase 1B.</p>
        )}
      </section>

      {series.length > 0 && (
        <ResultPanel
          title="Shortfall each year"
          note="Money needed for all goals that the plan can't cover, per year. Lower is better."
          actions={
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {series.map((s) => {
                const i = cols.findIndex((c) => c.key === s.key);
                return (
                  <span key={s.key} className="flex items-center gap-1.5">
                    <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={COMPARE_COLOURS[i]} strokeWidth="2" strokeDasharray={DASHES[i]} /></svg>
                    {s.name}
                  </span>
                );
              })}
            </div>
          }
        >
          <div className="h-72 px-2 pt-4 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={VIZ.grid} />
                <XAxis dataKey="year" tick={axisTick} tickLine={false} axisLine={{ stroke: VIZ.grid }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tickFormatter={axisMoney} tick={axisTick} tickLine={false} axisLine={false} width={64} />
                <Tooltip
                  cursor={{ stroke: VIZ.axis, strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      title={label}
                      rows={(payload ?? []).map((p) => {
                        const i = cols.findIndex((c) => c.key === p.dataKey);
                        return { label: cols[i]?.name ?? String(p.dataKey), value: Number(p.value), color: COMPARE_COLOURS[i] };
                      })}
                    />
                  )}
                />
                {series.map((s) => {
                  const i = cols.findIndex((c) => c.key === s.key);
                  return <Line key={s.key} type="linear" dataKey={s.key} stroke={COMPARE_COLOURS[i]} strokeWidth={2} strokeDasharray={DASHES[i]} dot={false} activeDot={{ r: 4 }} animationDuration={500} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ResultPanel>
      )}
    </div>
  );
}

function SectionRow({ label, span }: { label: string; span: number }) {
  return (
    <tr className="border-y border-line bg-surface/60">
      <th scope="colgroup" colSpan={span + 1} className="px-5 py-2 text-xs font-semibold text-ink-soft">{label}</th>
    </tr>
  );
}

function Row({ label, children, sub }: { label: string; children: React.ReactNode; sub?: boolean }) {
  return (
    <tr className="border-b border-line last:border-0">
      <th scope="row" className={cn("px-5 py-2.5 text-left font-normal", sub ? "pl-8 text-[13px] text-ink-soft" : "text-ink")}>{label}</th>
      {children}
    </tr>
  );
}

function Cell({ children, changed }: { children: React.ReactNode; changed?: boolean }) {
  return <td className={cn("px-5 py-2.5", changed ? "font-medium text-ink" : "text-muted")}>{children}{changed && <span className="ml-1.5 text-xs font-normal text-brand">changed</span>}</td>;
}

function MetricRow({
  label, cols, get, fmt, better, delta, sub,
}: {
  label: string;
  cols: Array<{ key: string; h?: Headline }>;
  get: (h: Headline) => number | undefined;
  fmt: (v: number | undefined, h: Headline) => string;
  better: Better;
  delta: (d: number) => string;
  sub?: boolean;
}) {
  const baseV = cols[0].h ? get(cols[0].h) : undefined;
  return (
    <Row label={label} sub={sub}>
      {cols.map((c, i) => {
        if (!c.h) return <td key={c.key} className="px-5 py-2.5 text-xs text-faint">After engine</td>;
        const v = get(c.h);
        let note: React.ReactNode = null;
        if (i > 0 && v != null && baseV != null) {
          const d = v - baseV;
          if (Math.abs(d) >= 0.5) {
            const good = better === "lower" ? d < 0 : d > 0;
            note = <span className={cn("ml-2 text-xs", good ? "text-brand" : "text-danger")}>{delta(d)} {good ? "better" : "worse"}</span>;
          } else note = <span className="ml-2 text-xs text-faint">same</span>;
        } else if (i > 0 && better === "later" && baseV != null && v == null) {
          note = <span className="ml-2 text-xs text-brand">better</span>;
        }
        return <td key={c.key} className="px-5 py-2.5 text-ink">{fmt(v, c.h)}{note}</td>;
      })}
    </Row>
  );
}
