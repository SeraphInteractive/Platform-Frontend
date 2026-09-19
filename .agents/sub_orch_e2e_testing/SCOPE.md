# Scope: E2E Testing Track

## Architecture
- **Track Philosophy**: Opaque-box, requirement-driven end-to-end testing independent of internal implementation details.
- **Verification Mechanisms**:
  1. Static and AST/DOM rule analysis (validating CSS breakpoints, touch target rules, classes, accessibility roles, media attributes).
  2. Integration & Typecheck integrity verification (`tsc --noEmit`, build artifacts, type consistency).
  3. Domain consensus & logic contract validation (verifying `@platform/internal-logic` rules, 6-point distribution, anti-stacking, rank invariants).
  4. Viewport & layout simulation (asserting mobile constraints at 320px, 375px, 414px, 768px, tablet 768-1023px, desktop >=1024px).
  5. End-to-end workflow scenarios (synthetic complete voter journey, pitch submission drawer, leaderboard review).
- **Execution Mechanism**: Standalone Node.js test runner (`node tests/runner.mjs`) with zero brittle dependencies, producing structured tier-by-tier reporting and standard exit codes.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Responsive Breakpoints & Layout | Mobile (<768px), tablet (768-1023px), desktop (>=1024px) | E2E-M2 (Tiers 1, 2) | R1 |
| 2 | Mobile Navigation | Bottom bar/drawer navigation replacing 64px vertical rail | E2E-M2 (Tiers 1, 3) | R1 |
| 3 | Horizontal Overflow Elimination | Zero horizontal scroll between 320px and 768px | E2E-M2 (Tiers 1, 2) | R1 |
| 4 | Page Wrapper Scroll Unlocking | View wrappers allow vertical scrolling without 100vh lock | E2E-M2 (Tiers 1, 2) | R1 |
| 5 | Inline Tap-to-Rank Card Controls | [1st], [2nd], [3rd] tap chips on candidate cards | E2E-M2 (Tiers 1, 3) | R2 |
| 6 | Touch Reorder Controls on Slots | Up/Down chevrons (▲/▼) on filled ballot slots | E2E-M2 (Tiers 1, 2) | R2 |
| 7 | 44×44px Touch Target Compliance | All interactive elements meet minimum 44×44px dimensions | E2E-M2 (Tiers 1, 2) | R2 |
| 8 | Mobile Bottom Sheet Dialogs | CreatePitchModal/drawers anchor to bottom on <768px with drag pill | E2E-M2 (Tiers 1, 3) | R2 |
| 9 | Mobile Modal Form Ergonomics | 44px close target, stacked action buttons, character counters | E2E-M2 (Tiers 1, 2) | R2 |
| 10 | Secondary Views Responsiveness | PublicLeaderboard podium order, table wrapping, 1-col Docs/Settings | E2E-M2 (Tiers 1, 2) | R1 |
| 11 | Sound & Media Policy Preservation | SoundEngine calls, muted thumbnails, controllable detail videos | E2E-M2 (Tiers 1, 3) | R3 |
| 12 | Consensus Logic & Build Integrity | 6-point rule, anti-stacking, active round, 0 typecheck/build errors | E2E-M2 (Tiers 1, 4) | R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E-M1 | Test Architecture & Runner Harness | Test runner CLI (`tests/runner.mjs`), test harness, reporter formatting, `TEST_INFRA.md` | none | IN_PROGRESS |
| E2E-M2 | 4-Tier Test Suite Construction | Tier 1 (Feature >=60), Tier 2 (Boundary >=60), Tier 3 (Pairwise >=12), Tier 4 (Scenarios >=6) | E2E-M1 | PLANNED |
| E2E-M3 | Validation, Audit & TEST_READY | Full suite execution, Challenger verification, Forensic Audit, `TEST_READY.md` publication | E2E-M2 | PLANNED |

## Interface Contracts
### Test Runner Interface
- Invocation: `node tests/runner.mjs` (or `npm test`)
- Flags:
  - `--tier=<1|2|3|4|all>` (default: `all`)
  - `--verbose` (detailed individual test output)
- Exit Code: `0` if all selected tests pass; `1` if any test fails.
- Output Format:
  - Clear section headers for each Tier (Tier 1: Feature Coverage, Tier 2: Boundary & Corner Cases, Tier 3: Cross-Feature Combinations, Tier 4: Real-World Applications).
  - Summary table listing total tests, passed, failed, and duration.
