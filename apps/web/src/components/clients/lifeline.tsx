"use client";

import type { FamilyMember } from "@omnimax/shared";
import { ageFromDob, yearAtAge } from "@/lib/format";

/**
 * Household life line: every member on one shared age scale (0–100),
 * showing age today, retirement age and life expectancy.
 * Uses only data entered on the profile; no projections.
 */
const SCALE = 100;
const pct = (n: number) => `${Math.min(Math.max(n, 0), SCALE)}%`;

export function Lifeline({ members }: { members: FamilyMember[] }) {
  const thisYear = new Date().getFullYear();
  return (
    <div>
      <div className="grid grid-cols-[92px_1fr] gap-x-3 sm:grid-cols-[180px_1fr_170px] sm:gap-x-5">
        {/* scale */}
        <span />
        <div className="relative mb-2 h-4 text-[11px] text-faint" aria-hidden>
          {[0, 20, 40, 60, 80, 100].map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>{t}</span>
          ))}
        </div>
        <span className="hidden sm:block" />

        {members.map((m) => {
          const age = ageFromDob(m.dateOfBirth);
          const retireYear = yearAtAge(m.dateOfBirth, m.retirementAge);
          const deathYear = yearAtAge(m.dateOfBirth, m.lifeExpectancy);
          let note: string;
          if (age == null) note = "Date of birth missing";
          else if (m.retirementAge == null) note = `Plan runs to ${deathYear}`;
          else if (m.retirementAge > age) note = `Retires in ${m.retirementAge - age} years, ${retireYear}`;
          else note = `Retired, plan runs to ${deathYear}`;
          const label = `${m.fullName}: ${age != null ? `age ${age}` : "age unknown"}, ${m.retirementAge != null ? `retirement age ${m.retirementAge}` : "no retirement age"}, life expectancy ${m.lifeExpectancy}. ${note}.`;

          return (
            <div key={m.id} className="contents">
              <div className="min-w-0 py-2.5">
                <p className="truncate text-[13px] font-medium text-ink">{m.fullName}</p>
                <p className="text-xs text-muted">{m.relationship}{age != null && `, ${age}`}</p>
              </div>
              <div className="relative flex items-center py-2.5" role="img" aria-label={label}>
                {/* gridlines */}
                {[20, 40, 60, 80].map((t) => (
                  <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-line/70" style={{ left: pct(t) }} />
                ))}
                <div className="relative h-2 w-full rounded-full bg-surface ring-1 ring-line ring-inset">
                  {/* remaining life up to life expectancy */}
                  <div className="absolute inset-y-0 rounded-full bg-brand-50" style={{ left: 0, width: pct(m.lifeExpectancy) }} />
                  {/* lived so far */}
                  {age != null && <div className="absolute inset-y-0 left-0 rounded-full bg-ink-soft" style={{ width: pct(age) }} />}
                  {/* retirement marker */}
                  {m.retirementAge != null && (
                    <span className="absolute -top-1.5 h-5 w-[3px] -translate-x-1/2 rounded-full bg-brand" style={{ left: pct(m.retirementAge) }} />
                  )}
                  {/* life expectancy end */}
                  <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-faint bg-white" style={{ left: pct(m.lifeExpectancy) }} />
                </div>
              </div>
              <p className="col-span-2 -mt-1 pb-2 pl-0 text-xs text-muted sm:col-span-1 sm:mt-0 sm:self-center sm:pb-0">{note}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-3 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-ink-soft" />Age in {thisYear}</span>
        <span className="flex items-center gap-1.5"><span className="h-3.5 w-[3px] rounded-full bg-brand" />Retirement age</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-brand-50 ring-1 ring-line ring-inset" />Years still to plan for</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-faint" />Life expectancy</span>
      </div>
    </div>
  );
}
