import { ASSET_SECTIONS } from "@/data/sheet-lists";
import { CATEGORY_ASSET_CLASS } from "@/data/assumption-defaults";

/** Which return each asset section uses. A proposal shown for adviser review. */
export function AssetClassMap() {
  return (
    <section className="rounded-lg border border-line bg-white">
      <div className="border-b border-line px-5 py-3.5">
        <h3 className="text-[15px] font-semibold text-ink">Which return each asset uses</h3>
        <p className="mt-0.5 text-xs text-muted">Proposed for review. Advisers to confirm before the calculations are built.</p>
      </div>
      <dl className="divide-y divide-line">
        {ASSET_SECTIONS.map((s) => (
          <div key={s.category} className="grid grid-cols-1 gap-x-6 px-5 py-2.5 text-sm sm:grid-cols-2">
            <dt className="text-ink-soft">{s.title}</dt>
            <dd className="font-medium text-ink">{CATEGORY_ASSET_CLASS[s.category]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
