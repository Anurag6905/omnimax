"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@omnimax/shared";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientStore } from "@/lib/store";
import { MemberForm } from "./member-form";
import { EMPTY_MEMBER, memberFromDraft, STATUS_LABEL, validateMember, type MemberDraft, type MemberErrors } from "./shared";

export function AddClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, users } = useAuth();
  const { addClient } = useClientStore();
  const router = useRouter();
  const advisers = users.filter((u) => u.role === "adviser" && u.isActive);
  const pickAdviser = can(user?.role, "clients.reassign");

  const [household, setHousehold] = useState("");
  const [status, setStatus] = useState<Client["status"]>("prospect");
  const [adviserId, setAdviserId] = useState("");
  const [draft, setDraft] = useState<MemberDraft>({ ...EMPTY_MEMBER, relationship: "Self" });
  const [errors, setErrors] = useState<MemberErrors & { household?: string; adviser?: string }>({});

  function reset() {
    setHousehold("");
    setStatus("prospect");
    setAdviserId("");
    setDraft({ ...EMPTY_MEMBER, relationship: "Self" });
    setErrors({});
  }

  function close() {
    reset();
    onClose();
  }

  function save() {
    const e: typeof errors = validateMember(draft);
    if (pickAdviser && !adviserId) e.adviser = "Choose the adviser for this client.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const surname = draft.fullName.trim().split(/\s+/).slice(-1)[0];
    const id = addClient(
      {
        householdName: household.trim() || `${surname} family`,
        status,
        adviserId: pickAdviser ? adviserId : user!.id,
        dataSheetDate: new Date().toISOString().slice(0, 10),
      },
      memberFromDraft(draft),
    );
    reset();
    onClose();
    router.push(`/clients/${id}`);
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add client"
      description="Start with the main client. Add family members, income, goals and assets from their profile."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={save}>Add client</Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-3 text-[13px] font-semibold text-ink">Household</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Household name" hint="Leave blank to use the surname">
              {(id, d) => <Input id={id} aria-describedby={d} value={household} onChange={(e) => setHousehold(e.target.value)} placeholder="Sharma family" />}
            </Field>
            <Field label="Status">
              {(id) => (
                <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as Client["status"])}>
                  {(Object.keys(STATUS_LABEL) as Client["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </Select>
              )}
            </Field>
            {pickAdviser ? (
              <Field label="Adviser" required error={errors.adviser}>
                {(id, d) => (
                  <Select id={id} aria-describedby={d} aria-invalid={!!errors.adviser} value={adviserId} onChange={(e) => setAdviserId(e.target.value)}>
                    <option value="">Choose</option>
                    {advisers.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                  </Select>
                )}
              </Field>
            ) : (
              <Field label="Adviser" hint="New clients are assigned to you">
                {(id, d) => <Input id={id} aria-describedby={d} value={user?.fullName ?? ""} disabled />}
              </Field>
            )}
          </div>
        </fieldset>
        <div className="border-t border-line pt-5">
          <MemberForm draft={draft} errors={errors} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} compact lockRelationship />
        </div>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
