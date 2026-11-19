"use client";

import { PageHeader } from "@/components/ui/page-header";
import { ReturnsPanel } from "@/components/assumptions/returns-panel";
import { InflationPanel } from "@/components/assumptions/inflation-panel";
import { AssetClassMap } from "@/components/assumptions/asset-class-map";
import { useAuth } from "@/lib/auth";
import { can } from "@/lib/roles";
import { useClientStore } from "@/lib/store";
import { effectiveInflation, effectiveReturns } from "@/lib/assumptions";
import { formatDate } from "@/lib/format";

/** Firm-wide default assumptions. Every client plan starts from these. */
export default function FirmAssumptionsPage() {
  const { user, users } = useAuth();
  const { firmAssumptions: firm, setFirmAssumptions } = useClientStore();
  const editable = can(user?.role, "assumptions.editFirm");
  const by = users.find((u) => u.id === firm.updatedBy)?.fullName;

  return (
    <>
      <PageHeader
        title="Firm assumptions"
        description={
          <>
            Defaults every client plan starts from. A plan can change any of them on the client&apos;s Assumptions tab.
            {firm.updatedAt && <> Last changed {formatDate(firm.updatedAt.slice(0, 10))}{by ? ` by ${by}` : ""}.</>}
          </>
        }
      />

      <p className="mb-6 rounded-md border border-warn/25 bg-warn-50 px-4 py-3 text-[13px] text-ink-soft">
        <span className="font-medium text-warn">Sample values.</span> These rates are placeholders for reviewing the screens. The firm sets the real ones before Phase 1B.
        {!editable && " Only admins can change firm assumptions."}
      </p>

      <div className="flex flex-col gap-6">
        <ReturnsPanel
          mode="firm"
          rows={effectiveReturns(firm)}
          retirement={{}}
          editable={editable}
          onSave={(v) => {
            const exists = firm.returns.some((r) => r.assetClass === v.assetClass);
            setFirmAssumptions({ ...firm, returns: exists ? firm.returns.map((r) => (r.assetClass === v.assetClass ? v : r)) : [...firm.returns, v] });
          }}
          onReset={(cls) => setFirmAssumptions({ ...firm, returns: firm.returns.filter((r) => r.assetClass !== cls) })}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <InflationPanel mode="firm" rows={effectiveInflation(firm)} editable={editable} onSave={(rates) => setFirmAssumptions({ ...firm, inflation: rates })} />
          <AssetClassMap />
        </div>
      </div>
    </>
  );
}
