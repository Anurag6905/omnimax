import type { Client, FamilyMember, User } from "@omnimax/shared";

/** Sample data for Phase 1A screens. Fictional people only — never real clients. */

export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: User[] = [
  { id: "u-priya", fullName: "Priya Nair", email: "priya@omnimax.demo", role: "adviser", isActive: true },
  { id: "u-arjun", fullName: "Arjun Mehta", email: "arjun@omnimax.demo", role: "adviser", isActive: true },
  { id: "u-kavita", fullName: "Kavita Rao", email: "kavita@omnimax.demo", role: "operations", isActive: true },
  { id: "u-sameer", fullName: "Sameer Khan", email: "sameer@omnimax.demo", role: "admin", isActive: true },
];

export type ClientRecord = Client & { createdAt: string; updatedAt: string };

export const SAMPLE_CLIENTS: ClientRecord[] = [
  { id: "c-1", clientCode: "CL-0001", householdName: "Sharma family", adviserId: "u-priya", status: "active", dataSheetDate: "2025-10-01", remarks: "Wants to retire early if the house loan is closed by 2032.", createdAt: "2025-10-02T10:00:00Z", updatedAt: "2026-11-18T09:20:00Z" },
  { id: "c-2", clientCode: "CL-0002", householdName: "Iyer family", adviserId: "u-priya", status: "active", dataSheetDate: "2025-08-14", createdAt: "2025-08-15T10:00:00Z", updatedAt: "2026-11-12T14:00:00Z" },
  { id: "c-3", clientCode: "CL-0003", householdName: "D'Souza family", adviserId: "u-arjun", status: "active", dataSheetDate: "2025-06-03", remarks: "NRI in Dubai, plans to return to Goa at retirement.", createdAt: "2025-06-04T10:00:00Z", updatedAt: "2026-11-05T11:00:00Z" },
  { id: "c-4", clientCode: "CL-0004", householdName: "Banerjee family", adviserId: "u-arjun", status: "prospect", createdAt: "2026-11-10T10:00:00Z", updatedAt: "2026-11-17T16:45:00Z" },
  { id: "c-5", clientCode: "CL-0005", householdName: "Reddy family", adviserId: "u-priya", status: "active", dataSheetDate: "2024-12-20", createdAt: "2024-12-21T10:00:00Z", updatedAt: "2026-10-28T08:30:00Z" },
  { id: "c-6", clientCode: "CL-0006", householdName: "Kapoor family", adviserId: "u-arjun", status: "inactive", dataSheetDate: "2023-03-11", remarks: "Paused planning in 2025.", createdAt: "2023-03-12T10:00:00Z", updatedAt: "2025-04-02T10:00:00Z" },
  { id: "c-7", clientCode: "CL-0007", householdName: "Gill family", adviserId: "u-priya", status: "prospect", createdAt: "2026-11-15T10:00:00Z", updatedAt: "2026-11-19T07:10:00Z" },
  { id: "c-8", clientCode: "CL-0008", householdName: "Joshi family", adviserId: "u-arjun", status: "active", dataSheetDate: "2025-09-09", createdAt: "2025-09-10T10:00:00Z", updatedAt: "2026-11-01T12:00:00Z" },
];

type M = Omit<FamilyMember, "id" | "sortOrder" | "lifeExpectancy"> & { lifeExpectancy?: number };
const rows: Array<[string, M]> = [
  ["c-1", { clientId: "c-1", isPrimary: true, fullName: "Rahul Sharma", relationship: "Self", occupation: "Salaried", dateOfBirth: "1985-04-12", retirementAge: 55, financiallyDependent: false, healthStatus: "Good", tobaccoUser: false, panNumber: "ABCPS1234K", mobile: "98201 45567", email: "rahul.sharma@example.com", residenceStatus: "Resident Indian", companyDesignation: "Tata Consultancy Services, Delivery Manager" }],
  ["c-1", { clientId: "c-1", isPrimary: false, fullName: "Neha Sharma", relationship: "Spouse", occupation: "Salaried", dateOfBirth: "1988-09-30", retirementAge: 55, financiallyDependent: false, healthStatus: "Good", tobaccoUser: false, panNumber: "BCDPS5678L", mobile: "98201 45568", residenceStatus: "Resident Indian", companyDesignation: "HDFC Bank, Relationship Manager" }],
  ["c-1", { clientId: "c-1", isPrimary: false, fullName: "Aarav Sharma", relationship: "Son", occupation: "Student", dateOfBirth: "2014-02-18", financiallyDependent: true, healthStatus: "Good", residenceStatus: "Resident Indian" }],
  ["c-1", { clientId: "c-1", isPrimary: false, fullName: "Kamla Sharma", relationship: "Mother", occupation: "Retired", dateOfBirth: "1958-07-05", financiallyDependent: true, healthStatus: "Diabetic, controlled", lifeExpectancy: 85, residenceStatus: "Resident Indian" }],
  ["c-2", { clientId: "c-2", isPrimary: true, fullName: "Venkat Iyer", relationship: "Self", occupation: "Business", dateOfBirth: "1976-11-02", retirementAge: 62, financiallyDependent: false, healthStatus: "Good", panNumber: "AAKPI4433M", mobile: "98450 11223", email: "venkat@iyertextiles.example", residenceStatus: "Resident Indian", companyDesignation: "Iyer Textiles, Proprietor" }],
  ["c-2", { clientId: "c-2", isPrimary: false, fullName: "Lakshmi Iyer", relationship: "Spouse", occupation: "Homemaker", dateOfBirth: "1979-03-21", financiallyDependent: true, healthStatus: "Good", residenceStatus: "Resident Indian" }],
  ["c-2", { clientId: "c-2", isPrimary: false, fullName: "Meera Iyer", relationship: "Daughter", occupation: "Student", dateOfBirth: "2006-06-14", financiallyDependent: true, residenceStatus: "Resident Indian" }],
  ["c-3", { clientId: "c-3", isPrimary: true, fullName: "Joel D'Souza", relationship: "Self", occupation: "Salaried", dateOfBirth: "1981-01-27", retirementAge: 58, financiallyDependent: false, healthStatus: "Good", panNumber: "CFGPD7788Q", mobile: "+971 50 412 7788", email: "joel.dsouza@example.com", residenceStatus: "NRI", companyDesignation: "Emirates Group, Senior Engineer" }],
  ["c-3", { clientId: "c-3", isPrimary: false, fullName: "Maria D'Souza", relationship: "Spouse", occupation: "Salaried", dateOfBirth: "1983-08-08", retirementAge: 58, financiallyDependent: false, residenceStatus: "NRI" }],
  ["c-4", { clientId: "c-4", isPrimary: true, fullName: "Ananya Banerjee", relationship: "Self", occupation: "Salaried", dateOfBirth: "1992-12-01", retirementAge: 60, financiallyDependent: false, mobile: "98300 55667", email: "ananya.b@example.com", residenceStatus: "Resident Indian" }],
  ["c-5", { clientId: "c-5", isPrimary: true, fullName: "Srinivas Reddy", relationship: "Self", occupation: "Retired", dateOfBirth: "1962-05-19", retirementAge: 60, financiallyDependent: false, healthStatus: "Hypertension", tobaccoUser: false, panNumber: "AEEPR2211F", mobile: "98490 33445", residenceStatus: "Resident Indian" }],
  ["c-5", { clientId: "c-5", isPrimary: false, fullName: "Padma Reddy", relationship: "Spouse", occupation: "Retired", dateOfBirth: "1965-10-10", retirementAge: 58, financiallyDependent: false, residenceStatus: "Resident Indian" }],
  ["c-6", { clientId: "c-6", isPrimary: true, fullName: "Rohan Kapoor", relationship: "Self", occupation: "Business", dateOfBirth: "1979-02-14", retirementAge: 60, financiallyDependent: false, mobile: "98110 99887", residenceStatus: "Resident Indian" }],
  ["c-7", { clientId: "c-7", isPrimary: true, fullName: "Harpreet Gill", relationship: "Self", occupation: "Professional", dateOfBirth: "1987-07-23", retirementAge: 60, financiallyDependent: false, mobile: "98140 12121", email: "dr.gill@example.com", residenceStatus: "Resident Indian", companyDesignation: "Gill Dental Clinic, Owner" }],
  ["c-7", { clientId: "c-7", isPrimary: false, fullName: "Simran Gill", relationship: "Spouse", occupation: "Professional", dateOfBirth: "1989-04-04", retirementAge: 60, financiallyDependent: false, residenceStatus: "Resident Indian" }],
  ["c-7", { clientId: "c-7", isPrimary: false, fullName: "Jasleen Gill", relationship: "Daughter", occupation: "Student", dateOfBirth: "2019-11-30", financiallyDependent: true, residenceStatus: "Resident Indian" }],
  ["c-8", { clientId: "c-8", isPrimary: true, fullName: "Nikhil Joshi", relationship: "Self", occupation: "Salaried", dateOfBirth: "1990-03-15", retirementAge: 58, financiallyDependent: false, panNumber: "BHJPJ9090A", mobile: "98220 76543", residenceStatus: "Resident Indian", companyDesignation: "Infosys, Product Lead" }],
  ["c-8", { clientId: "c-8", isPrimary: false, fullName: "Pooja Joshi", relationship: "Spouse", occupation: "Salaried", dateOfBirth: "1991-12-12", retirementAge: 58, financiallyDependent: false, residenceStatus: "Resident Indian" }],
];

export const SAMPLE_MEMBERS: FamilyMember[] = rows.map(([, m], i) => ({
  ...m,
  id: `m-${i + 1}`,
  sortOrder: i,
  lifeExpectancy: m.lifeExpectancy ?? 85, // sheet default
}));
