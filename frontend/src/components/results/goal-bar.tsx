import { formatINRShort } from "@/lib/format";
import { VIZ } from "./chart-kit";

/** Funded vs shortfall as one bar, with the share written out (never colour alone). */
export function GoalBar({ required, funded }: { required: number; funded: number }) {
  const pct = required ? Math.min(100, Math.round((funded / required) * 100)) : 0;
  const short = Math.max(0, required - funded);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="flex h-2.5 min-w-24 flex-1 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${pct}% funded${short > 0 ? `, ${formatINRShort(short)} short` : ""}`}
      >
        {pct > 0 && <div className="h-full rounded-full" style={{ width: `${pct}%`, background: VIZ.funded }} />}
        {pct < 100 && <div className="h-full flex-1 rounded-full" style={{ background: VIZ.shortfall, opacity: 0.85 }} />}
      </div>
      <span className="w-20 shrink-0 text-right text-xs font-medium text-ink">{pct}% funded</span>
    </div>
  );
}
