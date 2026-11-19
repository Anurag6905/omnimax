"use client";

import { useState } from "react";
import type { FamilyMember } from "@omnimax/shared";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClientStore } from "@/lib/store";
import { MemberForm } from "./member-form";
import { draftFromMember, EMPTY_MEMBER, memberFromDraft, validateMember, type MemberDraft, type MemberErrors } from "./shared";

interface Props {
  clientId: string;
  member?: FamilyMember; // edit when given, add otherwise
  onClose: () => void;
}

/** Mount only while open so the form starts fresh each time. */
export function MemberDialog({ clientId, member, onClose }: Props) {
  const { saveMember } = useClientStore();
  const [draft, setDraft] = useState<MemberDraft>(member ? draftFromMember(member) : EMPTY_MEMBER);
  const [errors, setErrors] = useState<MemberErrors>({});

  function save() {
    const e = validateMember(draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    saveMember({ ...memberFromDraft(draft), id: member?.id, clientId, isPrimary: member?.isPrimary ?? false });
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={member ? `Edit ${member.fullName}` : "Add family member"}
      description="Fields follow the Personal Details tab of the client data sheet."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{member ? "Save changes" : "Add member"}</Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <MemberForm draft={draft} errors={errors} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} lockRelationship={member?.isPrimary} />
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
