"use client";

import Link from "next/link";
import type { AssumptionSet, FamilyMember } from "@omnimax/shared";
import { ReturnsPanel } from "@/components/assumptions/returns-panel";
import { InflationPanel } from "@/components/assumptions/inflation-panel";
import { useClientRecords, useClientStore } from "@/lib/store";
import { effectiveInflation, effectiveReturns, mainRetirementYear } from "@/lib/assumptions";
import { yearAtAge } from "@/lib/format";
import { ASSET_SECTIONS } from "@/data/sheet-lists";
import type { TabProps } from "./types";

/** This client's plan assumptions: firm defaults, with any overrides for this plan. */
export function AssumptionsTab({ clientId, members, editable }: TabProps) {
  const { firmAssumptions: firm, planAssumptions, setPlanAssumptions } = useClientStore();
  const plan = planAssumptions.find((p) => p.clientId === clientId);
  const retirement = mainRetirementYear(members);
  const base: AssumptionSet = plan ?? { clientId, returns: [], inflation: {} };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        This plan uses the <Link href="/assumptions" className="font-medium text-brand hover:underline">firm assumptions</Link> unless you change a rate here. Changes apply to this client only.
      </p>

      <RetirementLinks clientId={clientId} members={members} returnsTied={effectiveReturns(firm, plan).filter((r) => r.periods.some((p) => p.endRule === "retirement")).map((r) => r.assetClass)} />

      <ReturnsPanel
        mode="plan"
        rows={effectiveReturns(firm, plan)}
        retirement={retirement}
        editable={editable}
        onSave={(v) => setPlanAssumptions(clientId, { ...base, returns: [...base.returns.filter((r) => r.assetClass !== v.assetClass), v] })}
        onReset={(cls) => setPlanAssumptions(clientId, { ...base, returns: base.returns.filter((r) => r.assetClass !== cls) })}
      />

      <InflationPanel
        mode="plan"
        rows={effectiveInflation(firm, plan)}
        firmRates={firm.inflation}
        planRates={plan?.inflation}
        editable={editable}
        onSave={(rates) => setPlanAssumptions(clientId, { ...base, inflation: rates })}
      />
    </div>
  );
}

/**
 * Everything in this plan tied to a retirement age (problems 1 and 12).
 * Change a retirement age on the Family tab and every year here moves with it.
 */
function RetirementLinks({ clientId, members, returnsTied }: { clientId: string; members: FamilyMember[]; returnsTied: string[] }) {
  const incomes = useClientRecords("incomes", clientId);
  const assets = useClientRecords("assets", clientId);
  const goals = useClientRecords("goals", clientId);

  const sectionTitle = (c: string) => ASSET_SECTIONS.find((s) => s.category === c)?.title ?? c;
  const people = members.filter((m) => m.retirementAge != null);
  const main = members.find((m) => m.isPrimary);

  const rows = people.map((m) => {
    const year = yearAtAge(m.dateOfBirth, m.retirementAge);
    const items: string[] = [
      ...incomes.filter((i) => i.memberId === m.id && i.endRule === "retirement").map((i) => `${i.incomeType} ends`),
      ...assets
        .filter((a) => a.ownerMemberId === m.id && a.contributionEndRule === "retirement")
        .map((a) => `${a.name ?? a.subType ?? sectionTitle(a.category)}: contributions stop`),
      ...goals.filter((g) => g.goalType === "retirement" && g.memberId === m.id).map((g) => `${g.name} starts`),
      ...(m.id === main?.id ? returnsTied.map((c) => `${c} return switches to its next rate`) : []),
    ];
    return { m, year, items };
  });

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="border-b border-line px-5 py-3.5">
        <h3 className="text-[15px] font-semibold text-ink">Tied to retirement</h3>
        <p className="mt-0.5 text-xs text-muted">
          These dates follow each person&apos;s retirement age. Change it on the Family tab and they all move together; nothing is retyped by hand.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-5 text-sm text-muted">No one in this household has a retirement age yet. Add one on the Family tab.</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ m, year, items }) => (
            <li key={m.id} className="grid gap-x-6 gap-y-1 px-5 py-3 sm:grid-cols-[220px_1fr]">
              <div>
                <p className="text-sm font-medium text-ink">{m.fullName}</p>
                <p className="text-xs text-muted">Retires at {m.retirementAge}{year ? `, in ${year}` : ""}</p>
              </div>
              {items.length ? (
                <ul className="flex flex-wrap gap-1.5 self-center">
                  {items.map((t) => (
                    <li key={t} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand ring-1 ring-brand-100 ring-inset">{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="self-center text-xs text-faint">Nothing linked to this retirement yet</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
