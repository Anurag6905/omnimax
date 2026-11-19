"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { FamilyMember, Goal, GoalFundingLink } from "@omnimax/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { newId, useClientStore, type FundingSource, type RecordKind, type RecordOf } from "@/lib/store";

/**
 * A section of the client data sheet as a table plus an add/edit dialog.
 * Each profile tab describes its sections with `fields` (the form) and
 * `columns` (the table); this component does the rest.
 */

export type FieldType =
  | "text" | "textarea" | "money" | "percent" | "number" | "date" | "month"
  | "year" | "yeardate" | "select" | "member" | "goal" | "yesno" | "goals";

type Option = string | { value: string; label: string };

export interface FieldDef {
  key: string;
  /** a function when the label depends on other answers (e.g. goal type) */
  label: string | ((draft: Draft) => string);
  type: FieldType;
  options?: readonly Option[];
  /** free-text field with suggestions (datalist) */
  suggestions?: readonly string[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  /** spans both columns of the form */
  wide?: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  showIf?: (draft: Draft) => boolean;
}

export type Draft = Record<string, string>;
type Errors = Record<string, string>;

export interface CellContext {
  member: (id?: string) => string;
  /** the full family member record, for dates such as retirement year */
  person: (id?: string) => FamilyMember | undefined;
  goal: (id?: string) => string;
  links: (sourceId: string) => GoalFundingLink[];
}

export interface ColumnDef<T> {
  label: string;
  cell: (row: T, ctx: CellContext) => ReactNode;
  align?: "right";
  /** footer total for this column */
  total?: (rows: T[]) => number;
}

type Row = { id: string; clientId: string };

interface Props<K extends RecordKind> {
  kind: K;
  clientId: string;
  title: string;
  description?: string;
  /** singular, lower case: "loan", "policy" */
  noun: string;
  rows: Array<RecordOf<K> & Row>;
  fields: FieldDef[];
  columns: Array<ColumnDef<RecordOf<K> & Row>>;
  /** values every record in this section has, e.g. { category: "mutual_fund" } */
  fixed?: Record<string, unknown>;
  defaults?: Draft;
  /** goals this section's records can be reserved for (Priority Goal 1/2/3) */
  funding?: "assetId" | "incomeId";
  validate?: (draft: Draft) => Errors;
  /** last chance to adjust a record before it is saved */
  beforeSave?: (record: RecordOf<K> & Row, isNew: boolean) => RecordOf<K> & Row;
  editable: boolean;
  members: FamilyMember[];
  goals: Goal[];
  rowActions?: (row: RecordOf<K> & Row) => ReactNode;
  footnote?: ReactNode;
}

// ---------- draft <-> record ----------

const toNumber = (s: string) => Number(s.replace(/[,\s₹]/g, ""));

function toDraft(record: Record<string, unknown>, fields: FieldDef[]): Draft {
  const d: Draft = {};
  for (const f of fields) {
    const v = record[f.key];
    if (f.type === "goals") continue;
    if (v == null) d[f.key] = "";
    else if (f.type === "yesno") d[f.key] = v ? "yes" : "no";
    else if (f.type === "month") d[f.key] = String(v).slice(0, 7);
    else if (f.type === "yeardate") d[f.key] = String(v).slice(0, 4);
    else d[f.key] = String(v);
  }
  return d;
}

function fromDraft(draft: Draft, fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "goals") continue;
    const raw = (draft[f.key] ?? "").trim();
    const hidden = f.showIf && !f.showIf(draft);
    if (!raw || hidden) {
      out[f.key] = undefined;
      continue;
    }
    switch (f.type) {
      case "money": case "percent": case "number": case "year": out[f.key] = toNumber(raw); break;
      case "yesno": out[f.key] = raw === "yes"; break;
      case "month": out[f.key] = `${raw}-01`; break;
      case "yeardate": out[f.key] = `${raw}-01-01`; break;
      default: out[f.key] = raw;
    }
  }
  return out;
}

function check(draft: Draft, fields: FieldDef[]): Errors {
  const e: Errors = {};
  for (const f of fields) {
    if (f.showIf && !f.showIf(draft)) continue;
    const raw = (draft[f.key] ?? "").trim();
    if (f.type === "goals") {
      const picked = [draft.goal1, draft.goal2, draft.goal3].filter(Boolean);
      if (new Set(picked).size !== picked.length) e.goals = "Pick each goal only once.";
      continue;
    }
    if (!raw) {
      if (f.required) e[f.key] = ["select", "member", "goal", "yesno"].includes(f.type) ? "Choose one." : `Enter ${labelOf(f, draft).toLowerCase()}.`;
      continue;
    }
    if (["money", "percent", "number", "year", "yeardate"].includes(f.type)) {
      const n = toNumber(raw);
      if (Number.isNaN(n)) { e[f.key] = "Enter a number."; continue; }
      if (n < 0) { e[f.key] = "Can't be negative."; continue; }
      if (f.type === "percent" && n > 100) { e[f.key] = "Enter a rate from 0 to 100."; continue; }
      if ((f.integer || f.type === "year" || f.type === "yeardate") && !Number.isInteger(n)) { e[f.key] = "Enter a whole number."; continue; }
      if ((f.type === "year" || f.type === "yeardate") && (n < 1900 || n > 2200)) { e[f.key] = "Enter a four-digit year."; continue; }
      if (f.min != null && n < f.min) { e[f.key] = `Enter ${f.min} or more.`; continue; }
      if (f.max != null && n > f.max) { e[f.key] = `Enter ${f.max} or less.`; continue; }
    }
  }
  return e;
}

const labelOf = (f: FieldDef, d: Draft) => (typeof f.label === "function" ? f.label(d) : f.label);

const optValue = (o: Option) => (typeof o === "string" ? o : o.value);
const optLabel = (o: Option) => (typeof o === "string" ? o : o.label);

// ---------- component ----------

export function RecordSection<K extends RecordKind>(props: Props<K>) {
  const { kind, clientId, title, description, noun, rows, fields, columns, fixed, defaults, funding, validate, beforeSave, editable, members, goals, rowActions, footnote } = props;
  const { saveRecord, removeRecord, setGoalLinks, records } = useClientStore();
  const [editing, setEditing] = useState<{ id?: string; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [removing, setRemoving] = useState<(RecordOf<K> & Row) | null>(null);

  const ctx: CellContext = useMemo(
    () => ({
      member: (id) => members.find((m) => m.id === id)?.fullName ?? "–",
      person: (id) => members.find((m) => m.id === id),
      goal: (id) => goals.find((g) => g.id === id)?.name ?? "–",
      links: (sourceId) =>
        records.goalLinks
          .filter((l) => (funding === "incomeId" ? l.incomeId === sourceId : l.assetId === sourceId))
          .sort((a, b) => a.rank - b.rank),
    }),
    [members, goals, records.goalLinks, funding],
  );

  function open(row?: RecordOf<K> & Row) {
    let draft: Draft = row ? toDraft(row as unknown as Record<string, unknown>, fields) : { ...Object.fromEntries(fields.map((f) => [f.key, ""])), ...defaults };
    if (funding) {
      const links = row ? ctx.links(row.id) : [];
      draft = { ...draft, goal1: "", goal2: "", goal3: "" };
      links.forEach((l) => (draft[`goal${l.rank}`] = l.goalId));
    }
    setErrors({});
    setEditing({ id: row?.id, draft });
  }

  function save() {
    if (!editing) return;
    const e = { ...check(editing.draft, fields), ...validate?.(editing.draft) };
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = editing.id ?? newId(kind.slice(0, 3));
    const prev = rows.find((r) => r.id === editing.id) ?? {};
    let record = { ...prev, ...fromDraft(editing.draft, fields), ...fixed, id, clientId } as unknown as RecordOf<K> & Row;
    if (beforeSave) record = beforeSave(record, !editing.id);
    saveRecord(kind, record);
    if (funding) {
      const source = { [funding]: id } as FundingSource;
      setGoalLinks(clientId, source, [editing.draft.goal1, editing.draft.goal2, editing.draft.goal3]);
    }
    setEditing(null);
  }

  const set = (key: string, value: string) => setEditing((s) => (s ? { ...s, draft: { ...s.draft, [key]: value } } : s));
  const hasTotals = rows.length > 0 && columns.some((c) => c.total);

  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">
            {title} <span className="ml-1 text-sm font-normal text-faint">{rows.length}</span>
          </h3>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {editable && (
          <Button size="sm" variant="secondary" onClick={() => open()}>
            <Plus size={15} /> Add {noun}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">
          No {noun} added yet.
          {editable && (
            <button onClick={() => open()} className="ml-1 font-medium text-brand hover:underline">Add {noun}</button>
          )}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.label} scope="col" className={cn("px-5 py-2.5 font-medium whitespace-nowrap", c.align === "right" && "text-right")}>{c.label}</th>
                ))}
                {editable && <th scope="col" className="px-3 py-2.5 md:sticky md:right-0 md:bg-surface"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface/50">
                  {columns.map((c) => (
                    <td key={c.label} className={cn("px-5 py-3 whitespace-nowrap text-ink", c.align === "right" && "text-right")}>{c.cell(r, ctx)}</td>
                  ))}
                  {editable && (
                    <td className="px-3 py-2 whitespace-nowrap md:sticky md:right-0 md:bg-white/95 md:backdrop-blur-sm">
                      <div className="flex justify-end gap-0.5">
                        {rowActions?.(r)}
                        <Button variant="ghost" size="sm" onClick={() => open(r)} aria-label={`Edit ${noun}`}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setRemoving(r)} aria-label={`Remove ${noun}`} className="text-muted hover:text-danger"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {hasTotals && (
              <tfoot className="border-t border-line-strong bg-surface/60 font-medium">
                <tr>
                  {columns.map((c, i) => (
                    <td key={c.label} className={cn("px-5 py-2.5 whitespace-nowrap", c.align === "right" && "text-right")}>
                      {c.total ? formatINR(c.total(rows)) : i === 0 ? "Total" : ""}
                    </td>
                  ))}
                  {editable && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
      {footnote && <div className="border-t border-line px-5 py-2.5 text-xs text-muted">{footnote}</div>}

      {editing && (
        <Dialog
          open
          onClose={() => setEditing(null)}
          title={`${editing.id ? "Edit" : "Add"} ${noun}`}
          description={title}
          size="lg"
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>{editing.id ? "Save changes" : `Add ${noun}`}</Button></>}
        >
          <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.filter((f) => !f.showIf || f.showIf(editing.draft)).map((f) =>
              f.type === "goals" ? (
                <GoalPicker key={f.key} draft={editing.draft} goals={goals} error={errors.goals} onChange={set} />
              ) : (
                <FieldControl key={f.key} field={f} label={labelOf(f, editing.draft)} value={editing.draft[f.key] ?? ""} error={errors[f.key]} members={members} goals={goals} onChange={(v) => set(f.key, v)} />
              ),
            )}
            <button type="submit" hidden />
          </form>
        </Dialog>
      )}

      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove this ${noun}?`}
        size="sm"
        footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Keep</Button><Button variant="danger" onClick={() => { removeRecord(kind, removing!.id); setRemoving(null); }}>Remove {noun}</Button></>}
      >
        <p className="text-sm text-ink-soft">It will be taken out of this client&apos;s data{funding ? ", along with any goals it was reserved for" : ""}.</p>
      </Dialog>
    </section>
  );
}

function FieldControl({ field: f, label, value, error, members, goals, onChange }: { field: FieldDef; label: string; value: string; error?: string; members: FamilyMember[]; goals: Goal[]; onChange: (v: string) => void }) {
  const listId = f.suggestions ? `list-${f.key}` : undefined;
  const moneyHint = f.type === "money" && value && !error && !Number.isNaN(toNumber(value)) ? formatINR(toNumber(value)) : undefined;
  return (
    <Field label={label} required={f.required} error={error} hint={moneyHint ?? f.hint} className={cn(f.wide && "sm:col-span-2")}>
      {(id, describedBy) => {
        const common = { id, "aria-describedby": describedBy, "aria-invalid": !!error, value, placeholder: f.placeholder };
        switch (f.type) {
          case "select":
            return (
              <Select {...common} onChange={(e) => onChange(e.target.value)}>
                <option value="">Choose</option>
                {f.options?.map((o) => <option key={optValue(o)} value={optValue(o)}>{optLabel(o)}</option>)}
              </Select>
            );
          case "member":
            return (
              <Select {...common} onChange={(e) => onChange(e.target.value)}>
                <option value="">Choose</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.fullName} ({m.relationship})</option>)}
              </Select>
            );
          case "goal":
            return (
              <Select {...common} onChange={(e) => onChange(e.target.value)}>
                <option value="">None</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            );
          case "yesno":
            return (
              <Select {...common} onChange={(e) => onChange(e.target.value)}>
                <option value="">Not given</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            );
          case "textarea":
            return <Textarea {...common} onChange={(e) => onChange(e.target.value)} />;
          case "date":
            return <Input {...common} type="date" onChange={(e) => onChange(e.target.value)} />;
          case "month":
            return <Input {...common} type="month" onChange={(e) => onChange(e.target.value)} />;
          case "money": case "percent": case "number": case "year": case "yeardate":
            return (
              <div className="relative">
                {f.type === "money" && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-faint">₹</span>}
                <Input {...common} inputMode="decimal" className={cn(f.type === "money" && "pl-7", f.type === "percent" && "pr-8")} onChange={(e) => onChange(e.target.value)} />
                {f.type === "percent" && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-faint">%</span>}
              </div>
            );
          default:
            return (
              <>
                <Input {...common} list={listId} onChange={(e) => onChange(e.target.value)} />
                {listId && <datalist id={listId}>{f.suggestions!.map((s) => <option key={s} value={s} />)}</datalist>}
              </>
            );
        }
      }}
    </Field>
  );
}

/** Priority Goal 1/2/3, as in the Investments sheet read by Input_Allocations.py. */
function GoalPicker({ draft, goals, error, onChange }: { draft: Draft; goals: Goal[]; error?: string; onChange: (k: string, v: string) => void }) {
  return (
    <fieldset className="rounded-md border border-line bg-surface/50 p-4 sm:col-span-2">
      <legend className="px-1 text-[13px] font-medium text-ink-soft">Reserved for goals</legend>
      <p className="mb-3 text-xs text-muted">
        Leave all three blank to use this for any goal. Goals listed here are funded from it first, in this order.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Field key={n} label={`Priority goal ${n}`}>
            {(id) => (
              <Select id={id} value={draft[`goal${n}`] ?? ""} aria-invalid={!!error} onChange={(e) => onChange(`goal${n}`, e.target.value)}>
                <option value="">None</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            )}
          </Field>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

/** Small helper for "reserved for" cells. */
export function GoalLinksCell({ links, goal }: { links: GoalFundingLink[]; goal: (id?: string) => string }) {
  if (!links.length) return <span className="text-faint">Any goal</span>;
  return (
    <span className="flex flex-col gap-0.5">
      {links.map((l) => (
        <span key={l.id} className="text-[13px]">
          <span className="mr-1 text-xs text-muted">{l.rank}.</span>
          {goal(l.goalId)}
        </span>
      ))}
    </span>
  );
}
