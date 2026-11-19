"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FamilyMember } from "@omnimax/shared";
import { SAMPLE_CLIENTS, SAMPLE_MEMBERS, type ClientRecord } from "./sample-data";

/**
 * Phase 1A client data store: sample data in memory, saved to this browser so
 * changes survive a refresh. Phase 1B swaps these functions for API calls.
 */
interface StoreState {
  clients: ClientRecord[];
  members: FamilyMember[];
  addClient: (client: Omit<ClientRecord, "id" | "clientCode" | "createdAt" | "updatedAt">, primary: Omit<FamilyMember, "id" | "clientId" | "isPrimary" | "sortOrder">) => string;
  updateClient: (id: string, patch: Partial<ClientRecord>) => void;
  saveMember: (member: Omit<FamilyMember, "id" | "sortOrder"> & { id?: string }) => void;
  removeMember: (id: string) => void;
  resetSampleData: () => void;
}

const StoreContext = createContext<StoreState | null>(null);
const KEY = "omx.data.v1";
const now = () => new Date().toISOString();
const newId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientRecord[]>(SAMPLE_CLIENTS);
  const [members, setMembers] = useState<FamilyMember[]>(SAMPLE_MEMBERS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const data = JSON.parse(saved) as { clients: ClientRecord[]; members: FamilyMember[] };
        /* eslint-disable react-hooks/set-state-in-effect */
        setClients(data.clients);
        setMembers(data.members);
      }
    } catch {}
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ clients, members }));
    } catch {}
  }, [clients, members, loaded]);

  const touch = useCallback((clientId: string) => {
    setClients((list) => list.map((c) => (c.id === clientId ? { ...c, updatedAt: now() } : c)));
  }, []);

  const addClient = useCallback<StoreState["addClient"]>((client, primary) => {
    const id = newId("c");
    setClients((list) => {
      const next = Math.max(0, ...list.map((c) => Number(c.clientCode.replace(/\D/g, "")) || 0)) + 1;
      return [{ ...client, id, clientCode: `CL-${String(next).padStart(4, "0")}`, createdAt: now(), updatedAt: now() }, ...list];
    });
    setMembers((list) => [...list, { ...primary, id: newId("m"), clientId: id, isPrimary: true, sortOrder: 0 }]);
    return id;
  }, []);

  const updateClient = useCallback((id: string, patch: Partial<ClientRecord>) => {
    setClients((list) => list.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)));
  }, []);

  const saveMember = useCallback<StoreState["saveMember"]>(
    (member) => {
      setMembers((list) => {
        if (member.id) return list.map((m) => (m.id === member.id ? { ...m, ...member, id: m.id } : m));
        const order = list.filter((m) => m.clientId === member.clientId).length;
        return [...list, { ...member, id: newId("m"), sortOrder: order }];
      });
      touch(member.clientId);
    },
    [touch],
  );

  const removeMember = useCallback(
    (id: string) => {
      const m = members.find((x) => x.id === id);
      setMembers((list) => list.filter((x) => x.id !== id));
      if (m) touch(m.clientId);
    },
    [members, touch],
  );

  const resetSampleData = useCallback(() => {
    setClients(SAMPLE_CLIENTS);
    setMembers(SAMPLE_MEMBERS);
  }, []);

  const value = useMemo(
    () => ({ clients, members, addClient, updateClient, saveMember, removeMember, resetSampleData }),
    [clients, members, addClient, updateClient, saveMember, removeMember, resetSampleData],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useClientStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useClientStore must be used inside ClientStoreProvider");
  return ctx;
}
