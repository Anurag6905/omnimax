"""
Generates test cases for the allocation port (seeded, so the same every run).
Cases are built to reach every branch of GoalAllocationSystem: reserved goals at
levels 1-4, pooled levels 5-8, small-vs-average splits, ties, "Fund all other goals",
goals missing in a year, investments not on the priority sheet, and unused Priority Goal 3.

Usage: python generate_cases.py <out.json> [count]
"""
import json
import random
import sys

FUND_ALL = "Fund all other goals"


def make_case(rng: random.Random, idx: int) -> dict:
    n_years = rng.randint(1, 5)
    start = 2026 + rng.randint(0, 10)
    years = list(range(start, start + n_years))
    goal_names = [f"Goal {chr(65 + i)}" for i in range(rng.randint(1, 6))]
    priorities = list(range(1, len(goal_names) + 1))
    rng.shuffle(priorities)  # priority need not follow name order
    inv_names = []
    for i in range(rng.randint(1, 7)):
        kind = rng.choice(["Asset", "Asset", "Income"])
        inv_names.append((f"{'Pension' if kind == 'Income' else 'Fund'} {i + 1}", kind))

    def amount() -> float:
        r = rng.random()
        if r < 0.15:
            return float(rng.choice([100000, 250000, 500000]))  # round numbers -> exact ties
        if r < 0.2:
            return 0.0
        return round(rng.uniform(1_000, 3_000_000), rng.choice([0, 2, 6]))

    goals = []
    for y in years:
        for g, p in zip(goal_names, priorities):
            if rng.random() < 0.75:  # some goals skip some years
                goals.append({"name": g, "priority": p, "year": y, "amount": amount()})
    investments = []
    for y in years:
        if rng.random() < 0.1:
            continue  # a year with no withdrawals at all
        for name, kind in inv_names:
            if rng.random() < 0.8:
                investments.append({"name": name, "year": y, "amount": amount(), "category": kind})

    def pick_goal():
        r = rng.random()
        if r < 0.35:
            return None
        if r < 0.45:
            return FUND_ALL
        if r < 0.5:
            return ""
        if r < 0.55:
            return "Goal Z"  # names a goal that never appears
        return rng.choice(goal_names)

    mapping = []
    for name, _ in inv_names:
        if rng.random() < 0.12:
            continue  # not on the priority sheet at all
        mapping.append({"name": name, "goal1": pick_goal(), "goal2": pick_goal(), "goal3": pick_goal()})
    rng.shuffle(mapping)
    return {"id": idx, "goals": goals, "investments": investments, "priorities": mapping}


def edge_cases(start_id: int) -> list:
    """Hand-built cases for corners random cases rarely hit."""
    A = lambda n, a, y=2030: {"name": n, "year": y, "amount": a, "category": "Asset"}
    I = lambda n, a, y=2030: {"name": n, "year": y, "amount": a, "category": "Income"}
    G = lambda n, p, a, y=2030: {"name": n, "priority": p, "year": y, "amount": a}
    any_ = lambda n: {"name": n, "goal1": None, "goal2": None, "goal3": None}
    cases = [
        # an investment exactly equal to the average share, listed after a bigger one (small-vs-equal ordering)
        {"goals": [G("A", 1, 500000)], "investments": [A("Big", 700000), A("Tie", 250000)], "priorities": [any_("Big"), any_("Tie")]},
        {"goals": [G("A", 1, 300)], "investments": [A("X", 400), A("Y", 100), A("Z", 100)], "priorities": [any_("X"), any_("Y"), any_("Z")]},
        # every investment exactly the average
        {"goals": [G("A", 1, 300)], "investments": [A("X", 100), A("Y", 100), A("Z", 100)], "priorities": [any_("X"), any_("Y"), any_("Z")]},
        # same goal name twice in one year (later amount wins; listed twice in priority order)
        {"goals": [G("A", 1, 100), G("B", 2, 50), G("A", 3, 400)], "investments": [A("X", 300)], "priorities": [any_("X")]},
        # same investment twice on the priority sheet
        {"goals": [G("A", 1, 100), G("B", 2, 100)], "investments": [A("X", 150)], "priorities": [{"name": "X", "goal1": "B", "goal2": None, "goal3": None}, {"name": "X", "goal1": "A", "goal2": None, "goal3": None}]},
        # a goal with no priority sorts last
        {"goals": [G("NoPri", None, 100), G("A", 2, 100)], "investments": [A("X", 150)], "priorities": [any_("X")]},
        # income in one year, asset in another: category comes from the first row
        {"goals": [G("A", 1, 100, 2030), G("A", 1, 100, 2031)], "investments": [I("Rent", 60, 2030), A("Rent", 60, 2031), A("Fund", 30, 2031)], "priorities": [any_("Rent"), any_("Fund")]},
        # income reserved for a goal already met (levels 1/3 don't check), then pooled
        {"goals": [G("A", 1, 100), G("B", 2, 100)], "investments": [I("P1", 100), I("P2", 80), A("F", 50)], "priorities": [{"name": "P1", "goal1": "A", "goal2": "B", "goal3": None}, {"name": "P2", "goal1": "A", "goal2": None, "goal3": "B"}, any_("F")]},
        # reserved goal name that isn't a goal this year
        {"goals": [G("A", 1, 100, 2030), G("B", 2, 100, 2031)], "investments": [A("F", 500, 2030), A("F", 500, 2031)], "priorities": [{"name": "F", "goal1": "B", "goal2": None, "goal3": None}]},
        # zero and tiny amounts, fractional rupees
        {"goals": [G("A", 1, 1000.37), G("B", 2, 0.0)], "investments": [A("X", 0.0), A("Y", 0.01), A("Z", 999.99)], "priorities": [any_("X"), any_("Y"), any_("Z")]},
    ]
    for i, c in enumerate(cases):
        c["id"] = start_id + i
    return cases


if __name__ == "__main__":
    out = sys.argv[1]
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 600
    rng = random.Random(20261120)
    cases = [make_case(rng, i) for i in range(count)]
    cases += edge_cases(count)
    with open(out, "w") as f:
        json.dump(cases, f, indent=None, separators=(",", ":"))
    print(f"wrote {count} cases to {out}")
