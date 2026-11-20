"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Asset, AssumptionSet, CreditCardProfile, Expense, FamilyMember, GeneralInsurancePolicy, Goal, GoalFundingLink,
  Income, Liability, LifeInsurancePolicy, Scenario,
} from "@omnimax/shared";
import { SAMPLE_CLIENTS, SAMPLE_MEMBERS, SAMPLE_RECORDS, type ClientRecord } from "@/data/sample-data";
import { SAMPLE_FIRM_ASSUMPTIONS } from "@/data/assumption-defaults";
import { SAMPLE_SCENARIOS } from "@/data/sample-scenarios";

/**
 * Phase 1A client data store: sample data in memory, saved to this browser so
 * changes survive a refresh. Phase 1B swaps these functions for API calls;
 * screens keep calling the same functions.
 */

/** Every per-client list, keyed by the db table it will map to. */
export type RecordMap = {
  incomes: Income[];
  expenses: Expense[];
  goals: Goal[];
  assets: Asset[];
  goalLinks: GoalFundingLink[];
  liabilities: Liability[];
  creditCards: CreditCardProfile[];
  lifePolicies: LifeInsurancePolicy[];
  generalPolicies: GeneralInsurancePolicy[];
};
export type RecordKind = keyof RecordMap;
export type RecordOf<K extends RecordKind> = RecordMap[K][number];

/** The source of a goal reservation: an asset or an income stream. */
export type FundingSource = { assetId: string } | { incomeId: string };

interface StoreState {
  clients: ClientRecord[];
  members: FamilyMember[];
  records: RecordMap;
  addClient: (client: Omit<ClientRecord, "id" | "clientCode" | "createdAt" | "updatedAt">, primary: Omit<FamilyMember, "id" | "clientId" | "isPrimary" | "sortOrder">) => string;
  updateClient: (id: string, patch: Partial<ClientRecord>) => void;
  saveMember: (member: Omit<FamilyMember, "id" | "sortOrder"> & { id?: string }) => void;
  removeMember: (id: string) => void;
  /** Insert or update one record (matched on id). Returns the id. */
  saveRecord: <K extends RecordKind>(kind: K, record: RecordOf<K>) => string;
  removeRecord: (kind: RecordKind, id: string) => void;
  /** Replace a source's Priority Goal 1/2/3. Blank entries mean "fund all other goals". */
  setGoalLinks: (clientId: string, source: FundingSource, goalIds: Array<string | undefined>) => void;
  /** Replace a client's monthly expenses (category id → amount). */
  setExpenses: (clientId: string, amounts: Record<number, number | undefined>) => void;
  saveCreditCard: (profile: CreditCardProfile) => void;
  /** firm-wide default assumptions */
  firmAssumptions: AssumptionSet;
  setFirmAssumptions: (set: AssumptionSet) => void;
  /** per-client overrides (only what differs from the firm default) */
  planAssumptions: AssumptionSet[];
  setPlanAssumptions: (clientId: string, set: AssumptionSet | undefined) => void;
  /** what-if scenarios; the plan itself is never changed by them */
  scenarios: Scenario[];
  saveScenario: (scenario: Omit<Scenario, "id" | "createdAt" | "updatedAt"> & { id?: string }) => string;
  removeScenario: (id: string) => void;
  /** copy a scenario's changes into the real plan (adviser confirms first) */
  applyScenario: (id: string) => void;
  resetSampleData: () => void;
}

const StoreContext = createContext<StoreState | null>(null);
const KEY = "omx.data.v4";
const now = () => new Date().toISOString();
export const newId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;
const idOf = (r: object) => ("id" in r ? (r as { id: string }).id : (r as { clientId: string }).clientId);

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientRecord[]>(SAMPLE_CLIENTS);
  const [members, setMembers] = useState<FamilyMember[]>(SAMPLE_MEMBERS);
  const [records, setRecords] = useState<RecordMap>(SAMPLE_RECORDS);
  const [firmAssumptions, setFirm] = useState<AssumptionSet>(SAMPLE_FIRM_ASSUMPTIONS);
  const [planAssumptions, setPlans] = useState<AssumptionSet[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>(SAMPLE_SCENARIOS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const data = JSON.parse(saved) as {
          clients: ClientRecord[]; members: FamilyMember[]; records: Partial<RecordMap>;
          firmAssumptions?: AssumptionSet; planAssumptions?: AssumptionSet[]; scenarios?: Scenario[];
        };
        /* eslint-disable react-hooks/set-state-in-effect */
        setClients(data.clients);
        setMembers(data.members);
        setRecords({ ...SAMPLE_RECORDS, ...data.records });
        if (data.firmAssumptions) setFirm(data.firmAssumptions);
        if (data.planAssumptions) setPlans(data.planAssumptions);
        if (data.scenarios) setScenarios(data.scenarios);
      }
    } catch {}
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ clients, members, records, firmAssumptions, planAssumptions, scenarios }));
    } catch {}
  }, [clients, members, records, firmAssumptions, planAssumptions, scenarios, loaded]);

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

  const saveRecord = useCallback<StoreState["saveRecord"]>(
    (kind, record) => {
      const id = idOf(record);
      setRecords((all) => {
        const list = all[kind] as Array<RecordOf<typeof kind>>;
        const exists = list.some((r) => idOf(r) === id);
        const next = exists ? list.map((r) => (idOf(r) === id ? record : r)) : [...list, record];
        return { ...all, [kind]: next };
      });
      touch(record.clientId);
      return id;
    },
    [touch],
  );

  const removeRecord = useCallback(
    (kind: RecordKind, id: string) => {
      setRecords((all) => {
        const target = (all[kind] as Array<{ clientId: string }>).find((r) => idOf(r) === id);
        if (target) touch(target.clientId);
        const next: RecordMap = { ...all, [kind]: (all[kind] as object[]).filter((r) => idOf(r) !== id) };
        // keep goal reservations consistent with what they point at
        if (kind === "goals") next.goalLinks = all.goalLinks.filter((l) => l.goalId !== id);
        if (kind === "assets") next.goalLinks = all.goalLinks.filter((l) => l.assetId !== id);
        if (kind === "incomes") next.goalLinks = all.goalLinks.filter((l) => l.incomeId !== id);
        return next;
      });
    },
    [touch],
  );

  const setGoalLinks = useCallback<StoreState["setGoalLinks"]>((clientId, source, goalIds) => {
    const matches = (l: GoalFundingLink) => ("assetId" in source ? l.assetId === source.assetId : l.incomeId === source.incomeId);
    setRecords((all) => {
      const kept = all.goalLinks.filter((l) => !matches(l));
      const added: GoalFundingLink[] = [];
      goalIds.forEach((goalId, i) => {
        if (goalId) added.push({ id: newId("gl"), clientId, goalId, rank: (i + 1) as 1 | 2 | 3, ...source });
      });
      return { ...all, goalLinks: [...kept, ...added] };
    });
  }, []);

  const setExpenses = useCallback<StoreState["setExpenses"]>(
    (clientId, amounts) => {
      setRecords((all) => {
        const others = all.expenses.filter((e) => e.clientId !== clientId);
        const mine = all.expenses.filter((e) => e.clientId === clientId);
        const next: Expense[] = [];
        for (const [cat, amount] of Object.entries(amounts)) {
          if (amount == null) continue;
          const prev = mine.find((e) => e.categoryId === Number(cat));
          next.push({ id: prev?.id ?? newId("ex"), clientId, categoryId: Number(cat), monthlyAmount: amount, remark: prev?.remark });
        }
        return { ...all, expenses: [...others, ...next] };
      });
      touch(clientId);
    },
    [touch],
  );

  const saveCreditCard = useCallback((profile: CreditCardProfile) => {
    setRecords((all) => ({ ...all, creditCards: [...all.creditCards.filter((c) => c.clientId !== profile.clientId), profile] }));
    touch(profile.clientId);
  }, [touch]);

  const setFirmAssumptions = useCallback((set: AssumptionSet) => {
    setFirm({ ...set, clientId: undefined, updatedAt: now() });
  }, []);

  const setPlanAssumptions = useCallback(
    (clientId: string, set: AssumptionSet | undefined) => {
      setPlans((list) => {
        const others = list.filter((p) => p.clientId !== clientId);
        const empty = !set || (!set.returns.length && !Object.values(set.inflation).some((v) => v != null));
        return empty ? others : [...others, { ...set, clientId, updatedAt: now() }];
      });
      touch(clientId);
    },
    [touch],
  );

  const saveScenario = useCallback<StoreState["saveScenario"]>((sc) => {
    const id = sc.id ?? newId("s");
    setScenarios((list) => {
      const prev = list.find((x) => x.id === id);
      const next: Scenario = { ...sc, id, createdAt: prev?.createdAt ?? now(), updatedAt: now() };
      return prev ? list.map((x) => (x.id === id ? next : x)) : [...list, next];
    });
    return id;
  }, []);

  const removeScenario = useCallback((id: string) => {
    setScenarios((list) => list.filter((x) => x.id !== id));
  }, []);

  const applyScenario = useCallback(
    (id: string) => {
      const sc = scenarios.find((x) => x.id === id);
      if (!sc) return;
      const { retirementAges, returns, inflation, goals } = sc.changes;
      // retirement ages: linked dates follow automatically
      if (retirementAges) setMembers((list) => list.map((m) => (retirementAges[m.id] != null ? { ...m, retirementAge: retirementAges[m.id] } : m)));
      // returns and inflation become this plan's overrides
      if (returns?.length || (inflation && Object.keys(inflation).length)) {
        setPlans((list) => {
          const cur = list.find((p) => p.clientId === sc.clientId) ?? { clientId: sc.clientId, returns: [], inflation: {} };
          const merged: AssumptionSet = {
            ...cur,
            returns: [...cur.returns.filter((r) => !returns?.some((x) => x.assetClass === r.assetClass)), ...(returns ?? [])],
            inflation: { ...cur.inflation, ...inflation },
            updatedAt: now(),
          };
          return [...list.filter((p) => p.clientId !== sc.clientId), merged];
        });
      }
      // goals: changed values copied in; goals left out are removed with their reservations
      if (goals) {
        setRecords((all) => {
          const dropped = new Set(Object.entries(goals).filter(([, g]) => g.include === false).map(([gid]) => gid));
          const nextGoals = all.goals
            .filter((g) => !dropped.has(g.id))
            .map((g) => {
              const c = goals[g.id];
              if (!c) return g;
              const { include: _include, ...values } = c;
              void _include;
              return { ...g, ...Object.fromEntries(Object.entries(values).filter(([, v]) => v != null)) };
            });
          return { ...all, goals: nextGoals, goalLinks: all.goalLinks.filter((l) => !dropped.has(l.goalId)) };
        });
      }
      touch(sc.clientId);
    },
    [scenarios, touch],
  );

  const resetSampleData = useCallback(() => {
    setClients(SAMPLE_CLIENTS);
    setMembers(SAMPLE_MEMBERS);
    setRecords(SAMPLE_RECORDS);
    setFirm(SAMPLE_FIRM_ASSUMPTIONS);
    setPlans([]);
    setScenarios(SAMPLE_SCENARIOS);
  }, []);

  const value = useMemo(
    () => ({
      clients, members, records, addClient, updateClient, saveMember, removeMember,
      saveRecord, removeRecord, setGoalLinks, setExpenses, saveCreditCard,
      firmAssumptions, setFirmAssumptions, planAssumptions, setPlanAssumptions,
      scenarios, saveScenario, removeScenario, applyScenario, resetSampleData,
    }),
    [clients, members, records, addClient, updateClient, saveMember, removeMember, saveRecord, removeRecord, setGoalLinks, setExpenses, saveCreditCard,
      firmAssumptions, setFirmAssumptions, planAssumptions, setPlanAssumptions,
      scenarios, saveScenario, removeScenario, applyScenario, resetSampleData],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useClientStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useClientStore must be used inside ClientStoreProvider");
  return ctx;
}

/** One client's records of a kind. */
export function useClientRecords<K extends RecordKind>(kind: K, clientId: string): RecordMap[K] {
  const { records } = useClientStore();
  return useMemo(() => (records[kind] as Array<RecordOf<K>>).filter((r) => r.clientId === clientId) as RecordMap[K], [records, kind, clientId]);
}
