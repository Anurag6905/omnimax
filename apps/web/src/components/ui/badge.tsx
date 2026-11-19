import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "warn" | "danger" | "outline";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface text-ink-soft ring-line",
  brand: "bg-brand-50 text-brand ring-brand-100",
  warn: "bg-warn-50 text-warn ring-warn/20",
  danger: "bg-danger-50 text-danger ring-danger/20",
  outline: "bg-white text-muted ring-line-strong",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
