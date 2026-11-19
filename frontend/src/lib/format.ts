const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Age as the Client Data Gathering Sheet calculates it:
 *   =YEAR(TODAY()) - YEAR(DOB)
 * i.e. calendar-year difference, not exact age on today's date.
 * Kept identical to the sheet until Omnimax's own rule is confirmed.
 */
export function ageFromDob(dob?: string, today: Date = new Date()): number | undefined {
  if (!dob) return undefined;
  const year = Number(dob.slice(0, 4));
  if (!year) return undefined;
  return today.getFullYear() - year;
}

/** Year in which a member reaches a given age (sheet convention: birth year + age). */
export function yearAtAge(dob: string | undefined, age: number | undefined): number | undefined {
  if (!dob || age == null) return undefined;
  return Number(dob.slice(0, 4)) + age;
}

/** dd-Mmm-yyyy, the date format used throughout the data sheet. */
export function formatDate(iso?: string): string {
  if (!iso) return "–";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "–";
  return `${String(d).padStart(2, "0")}-${MONTHS[m - 1]}-${y}`;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(iso.slice(0, 10));
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹ 1,24,50,000 – Indian digit grouping, whole rupees for display only. */
export function formatINR(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "–";
  return `₹ ${inr.format(n)}`;
}

/** Short form for tight spaces: ₹ 1.25 Cr, ₹ 4.5 L. */
export function formatINRShort(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "–";
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹ ${(n / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (abs >= 1e5) return `₹ ${(n / 1e5).toFixed(2).replace(/\.?0+$/, "")} L`;
  return formatINR(n);
}

export function formatPct(n?: number | null): string {
  return n == null ? "–" : `${n}%`;
}

/** "2032-03-01" → "Mar-2032" (the sheet's mmm-yyyy). */
export function formatMonth(iso?: string): string {
  if (!iso) return "–";
  const [y, m] = iso.split("-").map(Number);
  return y && m ? `${MONTHS[m - 1]}-${y}` : "–";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
