"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import type { FamilyMember } from "@omnimax/shared";
import { Panel } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Lifeline } from "@/components/clients/lifeline";
import { MemberDialog } from "@/components/clients/member-dialog";
import { useClientStore } from "@/lib/store";
import { ageFromDob, formatDate } from "@/lib/format";
import type { TabProps } from "./types";

/** Personal Details › "Tell us about you and your family". */
export function FamilyTab({ clientId, members, editable }: TabProps) {
  const { removeMember } = useClientStore();
  const [editing, setEditing] = useState<FamilyMember | "new" | null>(null);
  const [removing, setRemoving] = useState<FamilyMember | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Household life line">
        <div className="px-5 py-4">
          {members.length ? <Lifeline members={members} /> : <p className="text-sm text-muted">Add family members to see their life line.</p>}
        </div>
      </Panel>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Everyone in the household plan. Ages use the data sheet rule: this year minus year of birth.</p>
          {editable && (
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus size={15} /> Add family member
            </Button>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Date of birth</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Age</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Retirement age</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Life expectancy</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Dependent</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Residence</th>
                {editable && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.fullName} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-ink">
                          {m.fullName}
                          {m.isPrimary && <Badge tone="brand">Main client</Badge>}
                        </p>
                        <p className="text-xs text-muted">{[m.relationship, m.occupation].filter(Boolean).join(", ")}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDate(m.dateOfBirth)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{ageFromDob(m.dateOfBirth) ?? "–"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{m.retirementAge ?? <span className="text-faint">–</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{m.lifeExpectancy}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{m.financiallyDependent == null ? "–" : m.financiallyDependent ? "Yes" : "No"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{m.residenceStatus ?? "–"}</td>
                  {editable && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(m)} aria-label={`Edit ${m.fullName}`}>
                          <Pencil size={14} /> Edit
                        </Button>
                        {!m.isPrimary && (
                          <Button variant="ghost" size="sm" onClick={() => setRemoving(m)} aria-label={`Remove ${m.fullName}`} className="text-muted hover:text-danger">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <UserRound className="text-faint" />
              <p className="mt-2 text-sm text-muted">No family members yet.</p>
            </div>
          )}
        </div>
      </section>

      {editing && <MemberDialog clientId={clientId} member={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}

      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.fullName ?? ""}?`}
        description="They'll be taken out of this household plan. You can add them again later."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>Keep</Button>
            <Button variant="danger" onClick={() => { removeMember(removing!.id); setRemoving(null); }}>Remove member</Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">Goals, assets or policies linked to this person will show no owner until you pick a new one.</p>
      </Dialog>
    </div>
  );
}
