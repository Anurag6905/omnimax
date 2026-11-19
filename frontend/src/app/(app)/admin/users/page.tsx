"use client";

import Link from "next/link";
import { ROLES, type Role } from "@omnimax/shared";
import { PageHeader, Panel } from "@/components/ui/page-header";
import { Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { can, PERMISSIONS, ROLE_LABEL, ROLE_SUMMARY, type Permission } from "@/lib/roles";
import { useClientStore } from "@/lib/store";

const PERMISSION_LABEL: Record<Permission, string> = {
  "clients.viewAll": "See every client in the firm",
  "clients.create": "Add clients",
  "clients.edit": "Edit client data",
  "clients.reassign": "Change a client's adviser",
  "clients.delete": "Delete clients",
  "users.manage": "Manage staff and roles",
  "assumptions.editFirm": "Change firm-wide assumptions",
};

export default function UsersPage() {
  const { user, users, updateUser } = useAuth();
  const { clients, resetSampleData } = useClientStore();

  if (!can(user?.role, "users.manage")) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="font-medium text-ink">Only admins can manage staff</p>
        <p className="mt-1 text-sm text-muted">Ask an admin if you need a role changed.</p>
        <Link href="/clients" className="mt-4 text-sm font-medium text-brand hover:underline">Back to clients</Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Staff and roles" description="Who can sign in, and what each role can do." />

      <Panel title="Staff">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Name</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Role</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Clients</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const self = u.id === user?.id;
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} />
                        <div>
                          <p className="font-medium text-ink">{u.fullName}{self && <span className="font-normal text-muted"> (you)</span>}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        aria-label={`Role for ${u.fullName}`}
                        value={u.role}
                        disabled={self}
                        onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                        className="w-40"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-right text-ink-soft">{u.role === "adviser" ? clients.filter((c) => c.adviserId === u.id).length : "–"}</td>
                    <td className="px-5 py-3">
                      {self ? (
                        <Badge tone="brand">Signed in</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => updateUser(u.id, { isActive: !u.isActive })}>
                          {u.isActive ? "Switch off" : "Switch on"}
                        </Button>
                      )}
                      {!u.isActive && <Badge tone="outline" className="ml-2">Off</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="What each role can do" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} scope="col" className="px-5 py-2.5 text-center font-medium">
                    <span className="block text-ink-soft">{ROLE_LABEL[r]}</span>
                    <span className="block font-normal">{ROLE_SUMMARY[r]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(Object.keys(PERMISSIONS) as Permission[]).map((p) => (
                <tr key={p}>
                  <td className="px-5 py-3 text-ink">{PERMISSION_LABEL[p]}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-5 py-3 text-center">
                      {can(r, p) ? <span className="text-brand" aria-label="Yes">●</span> : <span className="text-line-strong" aria-label="No">○</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          This is a proposal for review. Changes here last until the page is refreshed; real accounts come with the backend in Phase 1B.
        </p>
      </Panel>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-line px-5 py-4">
        <div>
          <p className="text-sm font-medium text-ink">Reset sample data</p>
          <p className="text-xs text-muted">Puts the eight sample households back the way they started.</p>
        </div>
        <Button variant="secondary" onClick={resetSampleData}>Reset sample data</Button>
      </div>
    </>
  );
}
