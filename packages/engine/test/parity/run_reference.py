"""
Runs the ORIGINAL GoalAllocationSystem from reference/Input_Allocations.py on each
test case and writes its results, which the TypeScript tests must match.

The class is taken from the reference file as-is (text between "class
GoalAllocationSystem" and "# Example usage"); the rest of that script reads
Omnimax's Excel export and is not needed here.

Usage: python run_reference.py <cases.json> <expected.json>
Needs: pandas
"""
import json
import math
import sys
from pathlib import Path

import pandas as pd

REF = Path(__file__).resolve().parents[4] / "reference" / "Input_Allocations.py"
source = REF.read_text(encoding="utf-8")
start = source.index("class GoalAllocationSystem")
end = source.index("# Example usage")
namespace = {"pd": pd}
exec(compile(source[start:end], str(REF), "exec"), namespace)
GoalAllocationSystem = namespace["GoalAllocationSystem"]


def nan_if_none(v):
    return float("nan") if v is None else v


def to_frames(case):
    goals = pd.DataFrame(
        [[g["name"], g["priority"], g["year"], g["amount"]] for g in case["goals"]],
        columns=["Goal name", "Priority", "Year", "Amount"],
    )
    invs = pd.DataFrame(
        [[i["name"], i["year"], i["amount"], i["category"]] for i in case["investments"]],
        columns=["Investments Name", "Year", "Amount Withdrawn", "Category"],
    )
    pri = pd.DataFrame(
        [[p["name"], nan_if_none(p.get("goal1")), nan_if_none(p.get("goal2")), nan_if_none(p.get("goal3"))] for p in case["priorities"]],
        columns=["Investments Name", "Priority Goal 1", "Priority Goal 2", "Priority Goal 3"],
    )
    return goals, invs, pri


def num(v):
    v = float(v)
    return None if math.isnan(v) else v


results = []
for case in json.loads(Path(sys.argv[1]).read_text()):
    goals, invs, pri = to_frames(case)
    system = GoalAllocationSystem(goals, invs, pri)
    report = system.run_allocation()
    detailed = [
        {
            "level": a["Level"], "year": int(a["Year"]), "investment": a["Investment"], "goal": a["Goal"],
            "allocated": num(a["Allocated"]), "investmentBalance": num(a["Investment_Balance"]),
        }
        for a in system.detailed_allocations
    ]
    unfulfilled = [{"year": int(u["Year"]), "goal": u["Goal"], "unfulfilledAmount": num(u["Unfulfilled_Amount"])} for u in system.allocation_results]
    goal_summary, inv_summary = [], []
    if isinstance(report, tuple):
        _, gs, isum = report
        goal_summary = [{"year": int(r.Year), "key": r.Goal, "allocated": float(r.Allocated)} for r in gs.itertuples()]
        inv_summary = [{"year": int(r.Year), "key": r.Investment, "allocated": float(r.Allocated)} for r in isum.itertuples()]
    results.append({"id": case["id"], "detailed": detailed, "unfulfilled": unfulfilled, "goalSummary": goal_summary, "investmentSummary": inv_summary})

Path(sys.argv[2]).write_text(json.dumps(results, separators=(",", ":")))
print(f"reference results for {len(results)} cases -> {sys.argv[2]}")
