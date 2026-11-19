import type { FamilyMember } from "@omnimax/shared";

/** What every profile tab receives from the profile page. */
export interface TabProps {
  clientId: string;
  /** family members, main client first */
  members: FamilyMember[];
  /** whether the signed-in role may change this client's data */
  editable: boolean;
}
