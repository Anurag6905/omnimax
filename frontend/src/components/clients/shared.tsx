"use client";

import type { Client, FamilyMember, ResidenceStatus } from "@omnimax/shared";
import { RESIDENCE_STATUS } from "@omnimax/shared";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientStore } from "@/lib/store";

export const STATUS_LABEL: Record<Client["status"], string> = { active: "Active", prospect: "Prospect", inactive: "Inactive" };
const STATUS_TONE: Record<Client["status"], BadgeTone> = { active: "brand", prospect: "warn", inactive: "outline" };

export function StatusBadge({ status }: { status: Client["status"] }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export const RELATIONSHIP_SUGGESTIONS = ["Self", "Spouse", "Son", "Daughter", "Father", "Mother", "Father-in-law", "Mother-in-law", "Brother", "Sister"];
export const OCCUPATION_SUGGESTIONS = ["Salaried", "Business", "Professional", "Homemaker", "Student", "Retired"];
export const RESIDENCE_OPTIONS: readonly ResidenceStatus[] = RESIDENCE_STATUS;

/** Clients the signed-in person may see: advisers see only their own. */
export function useVisibleClients() {
  const { user } = useAuth();
  const { clients } = useClientStore();
  if (!user) return [];
  return can(user.role, "clients.viewAll") ? clients : clients.filter((c) => c.adviserId === user.id);
}

// ---------- member form validation (mirrors db/schema.sql checks) ----------

export type MemberDraft = {
  fullName: string;
  relationship: string;
  occupation: string;
  dateOfBirth: string;
  retirementAge: string;
  lifeExpectancy: string;
  financiallyDependent: "" | "yes" | "no";
  healthStatus: string;
  tobaccoUser: "" | "yes" | "no";
  healthHistory: string;
  panNumber: string;
  mobile: string;
  email: string;
  residenceStatus: "" | ResidenceStatus;
  companyDesignation: string;
};

export const EMPTY_MEMBER: MemberDraft = {
  fullName: "", relationship: "", occupation: "", dateOfBirth: "", retirementAge: "", lifeExpectancy: "85",
  financiallyDependent: "", healthStatus: "", tobaccoUser: "", healthHistory: "", panNumber: "", mobile: "",
  email: "", residenceStatus: "Resident Indian", companyDesignation: "",
};

const yn = (b?: boolean): "" | "yes" | "no" => (b == null ? "" : b ? "yes" : "no");
const toBool = (v: "" | "yes" | "no") => (v === "" ? undefined : v === "yes");
const opt = (s: string) => (s.trim() ? s.trim() : undefined);

export function draftFromMember(m: FamilyMember): MemberDraft {
  return {
    fullName: m.fullName, relationship: m.relationship, occupation: m.occupation ?? "", dateOfBirth: m.dateOfBirth ?? "",
    retirementAge: m.retirementAge?.toString() ?? "", lifeExpectancy: String(m.lifeExpectancy),
    financiallyDependent: yn(m.financiallyDependent), healthStatus: m.healthStatus ?? "", tobaccoUser: yn(m.tobaccoUser),
    healthHistory: m.healthHistory ?? "", panNumber: m.panNumber ?? "", mobile: m.mobile ?? "", email: m.email ?? "",
    residenceStatus: m.residenceStatus ?? "", companyDesignation: m.companyDesignation ?? "",
  };
}

export function memberFromDraft(d: MemberDraft): Omit<FamilyMember, "id" | "clientId" | "isPrimary" | "sortOrder"> {
  return {
    fullName: d.fullName.trim(), relationship: d.relationship.trim(), occupation: opt(d.occupation),
    dateOfBirth: opt(d.dateOfBirth), retirementAge: d.retirementAge ? Number(d.retirementAge) : undefined,
    lifeExpectancy: Number(d.lifeExpectancy), financiallyDependent: toBool(d.financiallyDependent),
    healthStatus: opt(d.healthStatus), tobaccoUser: toBool(d.tobaccoUser), healthHistory: opt(d.healthHistory),
    panNumber: opt(d.panNumber.toUpperCase()), mobile: opt(d.mobile), email: opt(d.email),
    residenceStatus: d.residenceStatus || undefined, companyDesignation: opt(d.companyDesignation),
  };
}

export type MemberErrors = Partial<Record<keyof MemberDraft, string>>;

export function validateMember(d: MemberDraft): MemberErrors {
  const e: MemberErrors = {};
  if (!d.fullName.trim()) e.fullName = "Enter the full name.";
  if (!d.relationship.trim()) e.relationship = "Enter how this person is related to the client.";
  if (d.dateOfBirth) {
    if (d.dateOfBirth > new Date().toISOString().slice(0, 10)) e.dateOfBirth = "Date of birth can't be in the future.";
    else if (d.dateOfBirth < "1900-01-01") e.dateOfBirth = "Check the year of birth.";
  }
  const life = Number(d.lifeExpectancy);
  if (!d.lifeExpectancy || !Number.isInteger(life) || life < 40 || life > 120) e.lifeExpectancy = "Enter a whole number from 40 to 120.";
  if (d.retirementAge) {
    const r = Number(d.retirementAge);
    if (!Number.isInteger(r) || r < 30 || r > 100) e.retirementAge = "Enter a whole number from 30 to 100.";
    else if (!e.lifeExpectancy && r >= life) e.retirementAge = "Retirement age must be below life expectancy.";
  }
  if (d.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(d.panNumber.trim().toUpperCase())) e.panNumber = "PAN has 10 characters, like ABCDE1234F.";
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Enter an email like name@example.com.";
  if (d.mobile && d.mobile.replace(/\D/g, "").length < 10) e.mobile = "Enter a 10-digit mobile number, with country code if outside India.";
  return e;
}
