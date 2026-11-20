import type { Scenario } from "@omnimax/shared";

/**
 * Two ready-made what-ifs for the Sharma family, each with illustrative results
 * (data/sample-results-*.json). Scenarios created on screen have no results until
 * the calculation engine exists.
 */
export const SAMPLE_SCENARIOS: Scenario[] = [
  {
    id: "s-retire-58",
    clientId: "c-1",
    name: "Rahul retires at 58",
    notes: "Client asked what three more working years would change.",
    changes: { retirementAges: { "m-1": 58 } },
    createdBy: "u-priya",
    createdAt: "2026-11-19T10:00:00Z",
    updatedAt: "2026-11-19T10:00:00Z",
  },
  {
    id: "s-lower-equity",
    clientId: "c-1",
    name: "Lower equity returns",
    notes: "Stress test: equity 10% until 2041, then 7%.",
    changes: {
      returns: [{ assetClass: "Equity", periods: [{ ratePct: 10, endRule: "year", endYear: 2041 }, { ratePct: 7, endRule: "open" }] }],
    },
    createdBy: "u-priya",
    createdAt: "2026-11-19T10:05:00Z",
    updatedAt: "2026-11-19T10:05:00Z",
  },
];
