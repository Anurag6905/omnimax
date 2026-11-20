"use client";

import { useMemo, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import type { FamilyMember, Goal, InflationKey, ReturnAssumption, Scenario, ScenarioChanges } from "@omnimax/shared";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { PeriodsDialog } from "@/components/assumptions/periods-dialog";
import { INFLATION_KEYS, INFLATION_LABEL } from "@/data/assumption-defaults";
import { GOAL_TYPE_LABEL } from "@/data/sheet-lists";
import { describePeriods, effectiveInflation, effectiveReturns, mainRetirementYear } from "@/lib/assumptions";
import { datesThatMove, isEmptyChange } from "@/lib/scenarios";
import { useClientRecords, useClientStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatINRShort, yearAtAge } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Props {
  clientId: string;
  members: FamilyMember[];
  /** edit this scenario; undefined = new */
  scenario?: Scenario;
  onClose: () => void;
  onSaved: (id: string) => void;
}

type GoalDraft = { include: boolean; costToday: string; when: string };

const num = (s: string) => Number(s.replace(/[,\s₹]/g, ""));
/** Which timing field a goal type uses in a scenario. */
const timing = (g: Goal): "startYear" | "startAge" | undefined =>
  ["vacation", "house", "car"].includes(g.goalType) ? "startYear" : ["education", "marriage"].includes(g.goalType) ? "startAge" : undefined;

/** Create or edit a what-if. Only fields that differ from the plan are saved. */
export function ScenarioEditor({ clientId, members, scenario, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { firmAssumptions: firm, planAssumptions, scenarios, saveScenario } = useClientStore();
  const goals = useClientRecords("goals", clientId);
  const incomes = useClientRecords("incomes", clientId);
  const assets = useClientRecords("assets", clientId);
  const plan = planAssumptions.find((p) => p.clientId === clientId);
  const c = scenario?.changes ?? {};

  const [name, setName] = useState(scenario?.name ?? "");
  const [notes, setNotes] = useState(scenario?.notes ?? "");
  const [ages, setAges] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m.id, c.retirementAges?.[m.id]?.toString() ?? ""])),
  );
  const [returns, setReturns] = useState<ReturnAssumption[]>(c.returns ?? []);
  const [inflation, setInflation] = useState<Record<string, string>>(
    Object.fromEntries(INFLATION_KEYS.map((k) => [k, c.inflation?.[k]?.toString() ?? ""])),
  );
  const [goalDrafts, setGoalDrafts] = useState<Record<string, GoalDraft>>(
    Object.fromEntries(
      goals.map((g) => {
        const gc = c.goals?.[g.id];
        const t = timing(g);
        const cost = g.goalType === "retirement" ? gc?.currentMonthlyExpenses : gc?.costToday;
        return [g.id, { include: gc?.include !== false, costToday: cost?.toString() ?? "", when: t ? gc?.[t]?.toString() ?? "" : "" }];
      }),
    ),
  );
  const [editingReturn, setEditingReturn] = useState<ReturnAssumption | null>(null);
  const [error, setError] = useState<string>();

  const planReturns = effectiveReturns(firm, plan);
  const planInflation = effectiveInflation(firm, plan);
  const earners = members.filter((m) => m.retirementAge != null || m.isPrimary);

  /** The changes as they stand in the form. */
  const draftChanges = useMemo<ScenarioChanges>(() => {
    const retirementAges: Record<string, number> = {};
    for (const m of members) {
      const v = ages[m.id]?.trim();
      if (v && num(v) !== m.retirementAge) retirementAges[m.id] = num(v);
    }
    const infl: Partial<Record<InflationKey, number>> = {};
    for (const k of INFLATION_KEYS) {
      const v = inflation[k]?.trim();
      if (v) infl[k] = num(v);
    }
    const goalChanges: NonNullable<ScenarioChanges["goals"]> = {};
    for (const g of goals) {
      const d = goalDrafts[g.id];
      if (!d) continue;
      const ch: NonNullable<ScenarioChanges["goals"]>[string] = {};
      if (!d.include) ch.include = false;
      if (d.costToday.trim()) ch[g.goalType === "retirement" ? "currentMonthlyExpenses" : "costToday"] = num(d.costToday);
      const t = timing(g);
      if (t && d.when.trim()) ch[t] = num(d.when);
      if (Object.keys(ch).length) goalChanges[g.id] = ch;
    }
    return { retirementAges, returns, inflation: infl, goals: goalChanges };
  }, [ages, inflation, goalDrafts, returns, members, goals]);

  const moved = datesThatMove(draftChanges, members, incomes, assets, goals, firm, plan);

  function save() {
    const n = name.trim();
    if (!n) return setError("Give the scenario a name, e.g. \"Retire at 58\".");
    if (scenarios.some((s) => s.clientId === clientId && s.id !== scenario?.id && s.name.toLowerCase() === n.toLowerCase()))
      return setError(`There is already a scenario called "${n}" for this client.`);
    for (const m of members) {
      const v = ages[m.id]?.trim();
      if (!v) continue;
      const a = num(v);
      if (!Number.isInteger(a) || a < 30 || a > 100) return setError(`${m.fullName}: retirement age must be a whole number from 30 to 100.`);
      if (a >= m.lifeExpectancy) return setError(`${m.fullName}: retirement age must be below life expectancy (${m.lifeExpectancy}).`);
    }
    for (const k of INFLATION_KEYS) {
      const v = inflation[k]?.trim();
      if (v && (Number.isNaN(num(v)) || num(v) < 0 || num(v) > 50)) return setError(`${INFLATION_LABEL[k]}: inflation must be from 0 to 50%.`);
    }
    for (const g of goals) {
      const d = goalDrafts[g.id];
      if (d.costToday.trim() && (Number.isNaN(num(d.costToday)) || num(d.costToday) < 0)) return setError(`${g.name}: enter a cost in rupees.`);
      const t = timing(g);
      if (t && d.when.trim()) {
        const w = num(d.when);
        if (t === "startYear" && (!Number.isInteger(w) || w < 2000 || w > 2200)) return setError(`${g.name}: enter a four-digit year.`);
        if (t === "startAge" && (!Number.isInteger(w) || w < 1 || w > 100)) return setError(`${g.name}: enter an age from 1 to 100.`);
      }
    }
    if (isEmptyChange(draftChanges)) return setError("Change at least one thing, or the scenario is the same as the plan.");
    const id = saveScenario({ id: scenario?.id, clientId, name: n, notes: notes.trim() || undefined, changes: draftChanges, createdBy: scenario?.createdBy ?? user?.id });
    onSaved(id);
  }

  const retirement = mainRetirementYear(members);

  return (
    <Dialog
      open
      onClose={onClose}
      title={scenario ? `Edit "${scenario.name}"` : "New scenario"}
      description="Change only what you want to test. Blank fields stay as in the plan; the plan itself is not changed."
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>{scenario ? "Save scenario" : "Create scenario"}</Button></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Scenario name" required>
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Retire at 58" />}
          </Field>
          <Field label="Notes">
            {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-9" placeholder="Why the client asked" />}
          </Field>
        </div>

        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-ink">Retirement age</legend>
          <p className="mb-3 text-xs text-muted">Everything tied to retirement moves with it: income that ends, SIPs that stop, retirement goals, return switches.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {earners.map((m) => {
              const v = ages[m.id];
              const newYear = v ? yearAtAge(m.dateOfBirth, num(v)) : undefined;
              return (
                <Field key={m.id} label={m.fullName} hint={`Plan: ${m.retirementAge ?? "not set"}${newYear ? `; would retire in ${newYear}` : ""}`}>
                  {(id, d) => (
                    <Input id={id} aria-describedby={d} inputMode="numeric" value={v} placeholder={m.retirementAge?.toString() ?? ""} onChange={(e) => setAges((a) => ({ ...a, [m.id]: e.target.value }))} />
                  )}
                </Field>
              );
            })}
          </div>
          {moved.some((x) => x.items.length) && (
            <div className="mt-3 rounded-md border border-brand-100 bg-brand-50/60 px-4 py-3">
              <p className="text-xs font-medium text-brand">Moves with it</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-[13px] text-ink-soft">
                {moved.flatMap((x) => x.items.map((it) => (
                  <li key={`${x.member.id}-${it.what}`}>{it.what}: <span className="text-faint line-through">{it.from}</span> <span className="font-medium text-ink">{it.to}</span></li>
                )))}
              </ul>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-ink">Returns</legend>
          <p className="mb-3 text-xs text-muted">Set once per asset class, not on every investment.</p>
          <ul className="divide-y divide-line rounded-md border border-line">
            {planReturns.map((r) => {
              const changed = returns.find((x) => x.assetClass === r.assetClass);
              return (
                <li key={r.assetClass} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{r.assetClass}</p>
                    <p className={cn("text-xs", changed ? "text-faint line-through" : "text-muted")}>{describePeriods(r.periods, retirement)}</p>
                    {changed && <p className="text-xs font-medium text-brand">{describePeriods(changed.periods, retirement)}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingReturn(changed ?? r)}><Pencil size={13} /> Change</Button>
                    {changed && (
                      <Button size="sm" variant="ghost" onClick={() => setReturns((l) => l.filter((x) => x.assetClass !== r.assetClass))}><RotateCcw size={13} /> As plan</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-[13px] font-semibold text-ink">Inflation</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {planInflation.map((r) => (
              <Field key={r.key} label={INFLATION_LABEL[r.key]} hint={`Plan: ${r.ratePct ?? "–"}%`}>
                {(id, d) => (
                  <Input id={id} aria-describedby={d} inputMode="decimal" value={inflation[r.key]} placeholder={r.ratePct?.toString()} onChange={(e) => setInflation((x) => ({ ...x, [r.key]: e.target.value }))} />
                )}
              </Field>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-ink">Goals</legend>
          <p className="mb-3 text-xs text-muted">Untick a goal to leave it out, or change its cost or timing.</p>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line bg-surface text-xs text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Keep</th>
                  <th scope="col" className="px-3 py-2 font-medium">Goal</th>
                  <th scope="col" className="w-40 px-3 py-2 font-medium">Cost today</th>
                  <th scope="col" className="w-32 px-3 py-2 font-medium">Year or age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...goals].sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99)).map((g) => {
                  const d = goalDrafts[g.id];
                  const t = timing(g);
                  const planCost = g.goalType === "retirement" ? g.currentMonthlyExpenses : g.costToday;
                  const planWhen = t ? g[t] : undefined;
                  const set = (patch: Partial<GoalDraft>) => setGoalDrafts((x) => ({ ...x, [g.id]: { ...x[g.id], ...patch } }));
                  return (
                    <tr key={g.id} className={cn(!d.include && "opacity-50")}>
                      <td className="px-3 py-2">
                        <input type="checkbox" aria-label={`Keep ${g.name}`} checked={d.include} onChange={(e) => set({ include: e.target.checked })} className="size-4 accent-[var(--color-brand)]" />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-ink">{g.name}</p>
                        <p className="text-xs text-muted">{GOAL_TYPE_LABEL[g.goalType]}{g.goalType === "retirement" ? ", monthly expenses" : ""}</p>
                      </td>
                      <td className="px-3 py-1.5">
                        <Input aria-label={`${g.name} cost`} inputMode="decimal" disabled={!d.include} value={d.costToday} placeholder={planCost ? formatINRShort(planCost).replace("₹ ", "") : ""} onChange={(e) => set({ costToday: e.target.value })} className="h-8" />
                      </td>
                      <td className="px-3 py-1.5">
                        {t ? (
                          <Input aria-label={`${g.name} ${t === "startYear" ? "year" : "age"}`} inputMode="numeric" disabled={!d.include} value={d.when} placeholder={planWhen?.toString() ?? ""} onChange={(e) => set({ when: e.target.value })} className="h-8" />
                        ) : (
                          <span className="text-xs text-faint">{g.goalType === "retirement" ? "Follows retirement age" : "–"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
        <button type="submit" hidden />
      </form>

      {editingReturn && (
        <PeriodsDialog
          value={editingReturn}
          retirementLabel={`${retirement.name ? `${retirement.name}'s` : "The main client's"} retirement`}
          existing={[]}
          onSave={(v) => { setReturns((l) => [...l.filter((x) => x.assetClass !== v.assetClass), v]); setEditingReturn(null); }}
          onClose={() => setEditingReturn(null)}
        />
      )}
    </Dialog>
  );
}
