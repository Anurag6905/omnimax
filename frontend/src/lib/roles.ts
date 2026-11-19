import type { Role } from "@omnimax/shared";

/**
 * Who can do what. Phase 1A proposal — confirm with the advisory team.
 *   adviser     – works on their own clients
 *   operations  – data entry and upkeep for every client
 *   admin       – everything, plus staff accounts and firm settings
 */
export const PERMISSIONS = {
  "clients.viewAll": ["operations", "admin"],
  "clients.create": ["adviser", "operations", "admin"],
  "clients.edit": ["adviser", "operations", "admin"],
  "clients.reassign": ["operations", "admin"],
  "clients.delete": ["admin"],
  "users.manage": ["admin"],
  "assumptions.editFirm": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const ROLE_LABEL: Record<Role, string> = {
  adviser: "Adviser",
  operations: "Operations",
  admin: "Admin",
};

export const ROLE_SUMMARY: Record<Role, string> = {
  adviser: "Sees and edits their own clients",
  operations: "Enters and maintains data for all clients",
  admin: "Full access, including staff accounts",
};
