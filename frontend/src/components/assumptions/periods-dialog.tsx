"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ReturnAssumption, ReturnPeriod } from "@omnimax/shared";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { checkPeriods, describePeriods } from "@/lib/assumptions";

type Draft = { ratePct: string; endRule: ReturnPeriod["endRule"]; endYear: string };

const toDraft = (p: ReturnPeriod): Draft => ({ ratePct: String(p.ratePct), endRule: p.endRule, endYear: p.endYear?.toString() ?? "" });
const fromDraft = (d: Draft): ReturnPeriod => ({
  ratePct: Number(d.ratePct),
  endRule: d.endRule,
  endYear: d.endRule === "year" ? Number(d.endYear) || undefined : undefined,
});

interface Props {
  /** undefined = adding a new asset class */
  value?: ReturnAssumption;
  /** label for the retirement boundary, e.g. "Rahul's retirement (2040)" */
  retirementLabel: string;
  /** asset classes already used, to stop duplicates when adding */
  existing: string[];
  onSave: (value: ReturnAssumption) => void;
  onClose: () => void;
}

/** Edit the return periods of one asset class, e.g. 12% until 2041, then 8%. */
export function PeriodsDialog({ value, retirementLabel, existing, onSave, onClose }: Props) {
  const [assetClass, setAssetClass] = useState(value?.assetClass ?? "");
  const [rows, setRows] = useState<Draft[]>(value ? value.periods.map(toDraft) : [{ ratePct: "", endRule: "open", endYear: "" }]);
  const [error, setError] = useState<string>();

  const periods = rows.map(fromDraft);
  const preview = rows.every((r) => r.ratePct !== "") && !checkPeriods(periods) ? describePeriods(periods, { name: undefined }) : undefined;

  function update(i: number, patch: Partial<Draft>) {
    setRows((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function addPeriod() {
    // the new period goes last and runs to the end; the old last one now needs an end
    setRows((list) => [...list.map((r, i) => (i === list.length - 1 && r.endRule === "open" ? { ...r, endRule: "year" as const } : r)), { ratePct: "", endRule: "open", endYear: "" }]);
  }

  function save() {
    const name = assetClass.trim();
    if (!name) return setError("Enter the asset class name.");
    if (!value && existing.some((e) => e.toLowerCase() === name.toLowerCase())) return setError(`${name} already has returns set.`);
    if (rows.some((r) => r.ratePct.trim() === "" || Number.isNaN(Number(r.ratePct)))) return setError("Enter a rate for every period.");
    const problem = checkPeriods(periods);
    if (problem) return setError(problem);
    onSave({ assetClass: name, periods });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={value ? `Returns for ${value.assetClass}` : "Add asset class"}
      description="Periods run in time order. The last one continues to the end of the plan."
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save}>Save returns</Button></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="flex flex-col gap-4">
        {!value && (
          <Field label="Asset class" required>
            {(id) => <Input id={id} value={assetClass} onChange={(e) => setAssetClass(e.target.value)} placeholder="e.g. Small-cap equity" />}
          </Field>
        )}
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => {
            const last = i === rows.length - 1;
            return (
              <div key={i} className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-md border border-line p-3 sm:grid-cols-[120px_1fr_120px_auto]">
                <Field label={i === 0 ? "Return" : "Then"}>
                  {(id) => (
                    <div className="relative">
                      <Input id={id} inputMode="decimal" value={r.ratePct} onChange={(e) => update(i, { ratePct: e.target.value })} className="pr-8" />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-faint">%</span>
                    </div>
                  )}
                </Field>
                <Field label="Until">
                  {(id) => (
                    <Select id={id} value={last ? "open" : r.endRule} disabled={last} onChange={(e) => update(i, { endRule: e.target.value as ReturnPeriod["endRule"] })}>
                      {last ? (
                        <option value="open">The end of the plan</option>
                      ) : (
                        <>
                          <option value="year">A set year</option>
                          <option value="retirement">{retirementLabel}</option>
                        </>
                      )}
                    </Select>
                  )}
                </Field>
                {!last && r.endRule === "year" ? (
                  <Field label="Year">
                    {(id) => <Input id={id} inputMode="numeric" value={r.endYear} onChange={(e) => update(i, { endYear: e.target.value })} placeholder="2041" />}
                  </Field>
                ) : (
                  <span className="hidden sm:block" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove period ${i + 1}`}
                  disabled={rows.length === 1}
                  onClick={() => setRows((list) => {
                    const next = list.filter((_, j) => j !== i);
                    return next.map((x, j) => (j === next.length - 1 ? { ...x, endRule: "open" as const, endYear: "" } : x));
                  })}
                  className="mb-0.5 text-muted hover:text-danger"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={addPeriod}><Plus size={14} /> Add a period</Button>
          {preview && <p className="text-[13px] text-muted">Reads as: <span className="text-ink">{preview}</span></p>}
        </div>
        {error && <p role="alert" className="rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
