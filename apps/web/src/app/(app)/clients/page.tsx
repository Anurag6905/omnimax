"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Users } from "lucide-react";
import type { Client } from "@omnimax/shared";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Avatar } from "@/components/ui/avatar";
import { AddClientDialog } from "@/components/clients/add-client-dialog";
import { STATUS_LABEL, StatusBadge, useVisibleClients } from "@/components/clients/shared";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientStore } from "@/lib/store";
import { formatRelative } from "@/lib/format";

type StatusFilter = "all" | Client["status"];

export default function ClientsPage() {
  const { user, users } = useAuth();
  const { members } = useClientStore();
  const clients = useVisibleClients();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [adviser, setAdviser] = useState("all");
  const [residence, setResidence] = useState("all");
  const [adding, setAdding] = useState(false);

  const seesAll = can(user?.role, "clients.viewAll");
  const advisers = users.filter((u) => u.role === "adviser");
  const userName = (id?: string) => users.find((u) => u.id === id)?.fullName ?? "Unassigned";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .map((c) => {
        const family = members.filter((m) => m.clientId === c.id).sort((a, b) => a.sortOrder - b.sortOrder);
        return { client: c, family, primary: family.find((m) => m.isPrimary) ?? family[0] };
      })
      .filter(({ client, family, primary }) => {
        if (status !== "all" && client.status !== status) return false;
        if (adviser !== "all" && client.adviserId !== adviser) return false;
        if (residence !== "all" && primary?.residenceStatus !== residence) return false;
        if (!q) return true;
        const haystack = [client.householdName, client.clientCode, ...family.flatMap((m) => [m.fullName, m.panNumber, m.mobile, m.email])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => b.client.updatedAt.localeCompare(a.client.updatedAt));
  }, [clients, members, query, status, adviser, residence]);

  const filtered = query || status !== "all" || adviser !== "all" || residence !== "all";
  const clear = () => {
    setQuery("");
    setStatus("all");
    setAdviser("all");
    setResidence("all");
  };
  const counts = {
    active: clients.filter((c) => c.status === "active").length,
    prospect: clients.filter((c) => c.status === "prospect").length,
  };

  return (
    <>
      <PageHeader
        title="Clients"
        description={
          seesAll
            ? `${clients.length} households across the firm: ${counts.active} active, ${counts.prospect} prospects`
            : `${clients.length} households in your book: ${counts.active} active, ${counts.prospect} prospects`
        }
        actions={
          can(user?.role, "clients.create") && (
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} /> Add client
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-center">
        <div className="relative md:max-w-sm md:flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, client code, PAN or mobile"
            aria-label="Search clients"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="w-auto min-w-36">
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_LABEL) as Client["status"][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>
          {seesAll && (
            <Select aria-label="Adviser" value={adviser} onChange={(e) => setAdviser(e.target.value)} className="w-auto min-w-40">
              <option value="all">All advisers</option>
              {advisers.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </Select>
          )}
          <Select aria-label="Residence" value={residence} onChange={(e) => setResidence(e.target.value)} className="w-auto min-w-40">
            <option value="all">Resident and NRI</option>
            <option value="Resident Indian">Resident Indian</option>
            <option value="NRI">NRI</option>
          </Select>
          {filtered && <Button variant="ghost" onClick={clear}>Clear filters</Button>}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Household</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Main client</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Family</th>
                {seesAll && <th scope="col" className="px-5 py-2.5 font-medium">Adviser</th>}
                <th scope="col" className="px-5 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ client, family, primary }) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer transition-colors hover:bg-surface/70"
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/clients/${client.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-ink hover:text-brand">
                      {client.householdName}
                    </Link>
                    <p className="text-xs text-muted">{client.clientCode}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-ink">{primary?.fullName ?? "–"}</p>
                    <p className="text-xs text-muted">{primary?.mobile ?? "No mobile"}{primary?.residenceStatus === "NRI" && ", NRI"}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {family.slice(0, 4).map((m) => <Avatar key={m.id} name={m.fullName} size="sm" className="ring-2 ring-white" />)}
                      </div>
                      <span className="text-xs text-muted">{family.length} {family.length === 1 ? "person" : "people"}</span>
                    </div>
                  </td>
                  {seesAll && <td className="px-5 py-3.5 text-ink-soft">{userName(client.adviserId)}</td>}
                  <td className="px-5 py-3.5"><StatusBadge status={client.status} /></td>
                  <td className="px-5 py-3.5 text-right text-muted">{formatRelative(client.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface text-muted"><Users size={18} /></span>
            {clients.length === 0 ? (
              <>
                <p className="mt-3 font-medium text-ink">No clients yet</p>
                <p className="mt-1 text-sm text-muted">Add a client to start their plan.</p>
                {can(user?.role, "clients.create") && <Button className="mt-4" onClick={() => setAdding(true)}><Plus size={16} /> Add client</Button>}
              </>
            ) : (
              <>
                <p className="mt-3 font-medium text-ink">No clients match these filters</p>
                <p className="mt-1 text-sm text-muted">Try another name or clear the filters to see all {clients.length} households.</p>
                <Button variant="secondary" className="mt-4" onClick={clear}>Clear filters</Button>
              </>
            )}
          </div>
        )}
      </div>
      {rows.length > 0 && filtered && (
        <p className="mt-3 text-xs text-muted">Showing {rows.length} of {clients.length} households</p>
      )}

      <AddClientDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
