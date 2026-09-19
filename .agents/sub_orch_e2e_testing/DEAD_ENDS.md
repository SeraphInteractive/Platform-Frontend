# Dead Ends: E2E Testing Track

| Iteration | Approach Tried | Why It Failed | Files Touched |
|-----------|---------------|---------------|---------------|
| 1 | In-test local mock functions (simulateReorder, createBallotState, local validation helpers) | Integrity violation: tests self-certify against their own local dummy code rather than inspecting actual application files in `src/`. Unimplemented features pass green falsely. | `tests/tier1/reorder.test.mjs`, `tests/tier2/reorder-bound.test.mjs`, `tests/tier1/rank-chips.test.mjs`, `tests/tier2/rank-chips-bound.test.mjs`, `tests/tier2/navigation-bound.test.mjs`, `tests/tier2/modal-form-bound.test.mjs` |
