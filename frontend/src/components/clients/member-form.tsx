"use client";

import { Field, Input, Select } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { ageFromDob } from "@/lib/format";
import { OCCUPATION_SUGGESTIONS, RELATIONSHIP_SUGGESTIONS, RESIDENCE_OPTIONS, type MemberDraft, type MemberErrors } from "./shared";

interface Props {
  draft: MemberDraft;
  errors: MemberErrors;
  onChange: (patch: Partial<MemberDraft>) => void;
  /** compact = only the fields needed to create a client */
  compact?: boolean;
  lockRelationship?: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-[13px] font-semibold text-ink">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function MemberForm({ draft, errors, onChange, compact, lockRelationship }: Props) {
  const age = ageFromDob(draft.dateOfBirth);
  const bind = <K extends keyof MemberDraft>(key: K) => ({
    value: draft[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ [key]: e.target.value } as Partial<MemberDraft>),
    "aria-invalid": !!errors[key],
  });

  return (
    <div className="flex flex-col gap-5">
      <datalist id="relationships">{RELATIONSHIP_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
      <datalist id="occupations">{OCCUPATION_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>

      <Section title="Person">
        <Field label="Full name" required error={errors.fullName} className="sm:col-span-2">
          {(id, d) => <Input id={id} aria-describedby={d} {...bind("fullName")} autoComplete="off" />}
        </Field>
        <Field label="Relationship" required error={errors.relationship} hint={lockRelationship ? "The main client is always Self." : undefined}>
          {(id, d) => <Input id={id} aria-describedby={d} list="relationships" disabled={lockRelationship} {...bind("relationship")} />}
        </Field>
        <Field label="Occupation">
          {(id) => <Input id={id} list="occupations" {...bind("occupation")} />}
        </Field>
        <Field label="Date of birth" error={errors.dateOfBirth} hint={age != null && !errors.dateOfBirth ? `Age ${age} this year` : undefined}>
          {(id, d) => <Input id={id} type="date" aria-describedby={d} max={new Date().toISOString().slice(0, 10)} {...bind("dateOfBirth")} />}
        </Field>
        <Field label="Residence status">
          {(id) => (
            <Select id={id} {...bind("residenceStatus")}>
              <option value="">Not given</option>
              {RESIDENCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Planning">
        <Field label="Retirement age" error={errors.retirementAge} hint="Leave blank for children and dependents">
          {(id, d) => <Input id={id} inputMode="numeric" aria-describedby={d} {...bind("retirementAge")} />}
        </Field>
        <Field label="Life expectancy" required error={errors.lifeExpectancy} hint="85 unless the client says otherwise">
          {(id, d) => <Input id={id} inputMode="numeric" aria-describedby={d} {...bind("lifeExpectancy")} />}
        </Field>
        <Field label="Financially dependent">
          {(id) => (
            <Select id={id} {...bind("financiallyDependent")}>
              <option value="">Not given</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          )}
        </Field>
      </Section>

      <Section title="Contact and identity">
        <Field label="Mobile" error={errors.mobile}>
          {(id, d) => <Input id={id} type="tel" aria-describedby={d} {...bind("mobile")} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(id, d) => <Input id={id} type="email" aria-describedby={d} {...bind("email")} />}
        </Field>
        {!compact && (
          <>
            <Field label="PAN" error={errors.panNumber}>
              {(id, d) => <Input id={id} aria-describedby={d} className="uppercase" maxLength={10} {...bind("panNumber")} />}
            </Field>
            <Field label="Company or business, and designation">
              {(id) => <Input id={id} {...bind("companyDesignation")} />}
            </Field>
          </>
        )}
      </Section>

      {!compact && (
        <Section title="Health">
          <Field label="Health status">
            {(id) => <Input id={id} placeholder="e.g. Good, Diabetic" {...bind("healthStatus")} />}
          </Field>
          <Field label="Uses tobacco">
            {(id) => (
              <Select id={id} {...bind("tobaccoUser")}>
                <option value="">Not given</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </Select>
            )}
          </Field>
          <Field label="Health history" className={cn("sm:col-span-2")}>
            {(id) => <Input id={id} {...bind("healthHistory")} />}
          </Field>
        </Section>
      )}
    </div>
  );
}
