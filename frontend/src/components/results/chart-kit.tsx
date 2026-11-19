"use client";

import type { ReactNode } from "react";
import { formatINR, formatINRShort } from "@/lib/format";

/**
 * Chart colours, checked with the dataviz validator on the white surface:
 * funded/shortfall and income/outflow pairs pass colour-blind and contrast checks.
 */
export const VIZ = {
  funded: "#0c8a68",
  shortfall: "#b42318",
  income: "#2a78d6",
  outflow: "#eb6834",
  single: "#0c8a68",
  grid: "#e6e8ee",
  axis: "#8a92a3",
  marker: "#14213d",
} as const;

export const axisTick = { fill: VIZ.axis, fontSize: 11 };

/** Label placement for retirement lines: alternate sides so close years don't overlap. */
export const retirementLabel = (name: string, i: number) => ({
  value: `${name} retires`,
  position: (i % 2 === 0 ? "insideTopRight" : "insideTopLeft") as "insideTopRight" | "insideTopLeft",
  fontSize: 11,
  fill: VIZ.marker,
});
export const axisMoney = (v: number) => formatINRShort(v).replace("₹ ", "₹");

/** Tooltip box used by every chart: title row, then label/value rows with a colour key. */
export function ChartTooltip({
  active,
  title,
  rows,
}: {
  active?: boolean;
  title?: ReactNode;
  rows: Array<{ label: string; value: number; color?: string }>;
}) {
  if (!active || !rows.length) return null;
  return (
    <div className="min-w-44 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-pop">
      {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted">
            {r.color && <span className="inline-block size-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-medium text-ink">{formatINR(r.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Legend row; identity is never colour alone, so each key has its name. */
export function Legend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.dashed ? (
            <span className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="inline-block h-2 w-4 rounded-sm" style={{ background: i.color }} />
          )}
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Panel with a title, optional note and actions, used for every results block. */
export function ResultPanel({ title, note, actions, children, className = "" }: { title: string; note?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-white ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
