# Handoff Report: E2E Test Suite & Infrastructure Review (Round 2)

**Agent**: `reviewer_1_r2` (Reviewer 1, E2E Testing Track)  
**Parent**: `cad2eebd-1824-4f1e-bd80-53f87985a200` (`parent` / `sub_orch_e2e_testing`)  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/sub_orch_e2e_testing/reviewer_1_r2`  
**Timestamp**: 2026-09-19T08:26:00Z  
**Type**: Hard Handoff (Review Complete)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Review Summary

**Verdict**: **REQUEST_CHANGES**

The test runner architecture (`tests/runner.mjs`), test harness (`tests/harness.mjs`), assertion library (`tests/assertions.mjs`), and reporter helpers (`tests/helpers/reporter.mjs`) demonstrate good engineering in CLI argument parsing, timeout guards, timer cancellation in `finally` blocks, and clean ANSI/ASCII terminal reporting. Furthermore, the tests directly executing `@platform/internal-logic` and CSS cascade rules (`tests/helpers/css-parser.mjs`) provide genuine, high-fidelity contract validation.

However, **REQUEST_CHANGES** is mandated due to two critical issues:
1. **Critical Finding: INTEGRITY VIOLATION**: At least 15 test cases across `tier1/` and `tier2/` use self-certifying dummy simulations defined inside the test files rather than inspecting or executing production code. For example, in `tests/tier2/reorder-bound.test.mjs`, all 5 tests assert against a local function `simulateReorder()`; `VotePage.tsx` AST is imported on line 8 but is never referenced anywhere in the file. Similarly, `tier2/navigation-bound.test.mjs` (`T2-NAV-01`) runs a 100-iteration for-loop on a local array variable rather than testing `App.tsx`.
2. **Critical Finding: VERIFICATION FAILURE (Typecheck & Build Broken)**: The upstream report claimed `npm run typecheck` and `node tests/runner.mjs --filter="Consensus"` pass with 0 errors (exit code 0). Independent verification revealed that `npm run typecheck` exits with code 2 (2 TypeScript errors in `src/components/TrajectoryCoordinateGraph.tsx:243` and `src/views/DevWorkbench/MomentsVarianceChart.tsx:177`). Consequently, `T1-LOG-05` and `T2-LOG-05` fail, causing `node tests/runner.mjs --filter="Consensus"` and `npm test` to fail.

---

## 2. Findings

### [Critical] Finding 1: INTEGRITY VIOLATION — Dummy / Facade Self-Certifying Tests
- **What**: Test cases that pass by testing their own inline dummy implementations rather than testing the application code.
- **Where**:
  - `tests/tier2/reorder-bound.test.mjs:10-73` (`T2-REORD-01` to `T2-REORD-05`):
    - Tests define local `simulateReorder(initialSlots)` and assert against it (`s.canMoveUp(1) === false`, `s.canMoveDown(3) === false`, etc.).
    - Line 8 imports `const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');`, but `voteAst` is never used in the file. The tests always pass 100% regardless of the state of `VotePage.tsx`.
  - `tests/tier1/reorder.test.mjs:11-61` (`T1-REORD-02` to `T1-REORD-05`):
    - Defines `createReorderableSlots()` locally in the test file and asserts against its own local functions instead of checking `VotePage.tsx`.
  - `tests/tier1/rank-chips.test.mjs:11-71` (`T1-RANK-02` to `T1-RANK-05`):
    - Defines `createBallotState()` locally in the test file and tests that its own local `selectRank()` sets `slots.rank1`.
  - `tests/tier2/rank-chips-bound.test.mjs:10-63` (`T2-RANK-01` to `T2-RANK-03`):
    - Defines `simulateBallotState()` locally and tests its own state manipulations.
  - `tests/tier2/navigation-bound.test.mjs:19-32` (`T2-NAV-01`):
    - Claims to verify that "rapidly switching between all 11 views does not corrupt routing state or cause memory leaks", but only executes a for-loop pushing strings into a local JavaScript array `visited.push(currentTab)`. It does not touch `App.tsx` or simulate routing.
  - `tests/tier2/modal-form-bound.test.mjs:12-34, 44-58, 67-71` (`T2-FORM-02`, `T2-FORM-03`, `T2-FORM-05`):
    - Defines `validatePitchForm()` and `countWords()` locally inside the test file and tests those local functions rather than verifying `CreatePitchModal.tsx`.
- **Why**: Under the adversarial review mandate, self-certifying work and dummy implementations that bypass genuine testing are integrity violations. These tests cannot detect regressions or missing features in `src/`.
- **Suggestion**:
  - Rewrite `T1-REORD-02`–`05` and `T2-REORD-01`–`05` to inspect `VotePage.tsx` using `voteAst` (e.g., verifying that `onReorderRank` handler swaps slot indices, that `disabled` attributes on rank 1 Up chevron and rank 3 Down chevron exist in JSX, and that chevrons render conditionally on occupied slots).
  - Rewrite `T1-RANK-02`–`05` and `T2-RANK-01`–`03` to inspect `VotePage.tsx` AST (verifying that clicking rank chips triggers rank placement, calls `onSelectRank(rank, entryId)`, and handles active state).
  - Rewrite `T2-NAV-01` to test the actual route dispatch logic in `src/App.tsx`.
  - Rewrite `T2-FORM-02`, `T2-FORM-03`, and `T2-FORM-05` to verify the validation logic, character limit (`MAX_CHAR_LIMIT`), and file size checks (`MAX_FILE_SIZE_BYTES`) directly in `src/components/CreatePitchModal.tsx`.

### [Critical] Finding 2: VERIFICATION FAILURE — TypeScript Compilation Errors (`npm run typecheck` exits 2)
- **What**: `npm run typecheck` fails with 2 TypeScript compiler errors, and `node tests/runner.mjs --filter="Consensus"` fails with 2 failing tests (`T1-LOG-05` and `T2-LOG-05`).
- **Where**:
  - `src/components/TrajectoryCoordinateGraph.tsx:243:21` (`error TS18048: 'xMin' is possibly 'undefined'`)
  - `src/views/DevWorkbench/MomentsVarianceChart.tsx:177:22` (`error TS2339: Property 'variance' does not exist on type 'EntryMoments'`)
  - `tests/tier1/consensus.test.mjs:45-52` (`T1-LOG-05`)
  - `tests/tier2/consensus-bound.test.mjs:65-73` (`T2-LOG-05`)
- **Why**: `ORIGINAL_REQUEST.md` (R3 / Acceptance Criteria) and `PROJECT.md` (Feature 26) strictly require `npm run typecheck` and `npm run build` to complete with zero errors.
- **Suggestion**:
  - In `src/components/TrajectoryCoordinateGraph.tsx:243`, use `computedXMin` instead of `xMin` (which is optional on the interface).
  - In `src/views/DevWorkbench/MomentsVarianceChart.tsx:177`, access the valid property on `EntryMoments` (e.g. `moments.totalVariance` or `moments.singleBallotVariance`).

### [Major] Finding 3: RESILIENCE DEFECT — Top-Level Unhandled Rejection in `tests/runner.mjs`
- **What**: In `tests/runner.mjs:88`, `const results = await harness.run({ ... });` is not wrapped in a `try ... catch` block.
- **Where**: `tests/runner.mjs:88`
- **Why**: While `TestHarness` catches errors within `test.fn()`, if a `beforeAll` or `beforeEach` hook throws an error, the rejection escapes `harness.run()`. This results in an unhandled top-level promise rejection that terminates Node.js before `renderSummaryTable()` or proper exit code reporting can run.
- **Suggestion**: Wrap the execution in `runner.mjs` with:
  ```javascript
  try {
    const results = await harness.run({ ... });
    ...
  } catch (err) {
    console.error(`\x1b[31m[FATAL] Test runner crashed:\x1b[0m`, err);
    process.exit(1);
  }
  ```

### [Minor] Finding 4: CSS Resolver Unit Limitation in `verifyTouchTarget`
- **What**: `CssResolver.prototype.verifyTouchTarget` in `tests/helpers/css-parser.mjs` only parses pixel dimensions matching `\d+px`.
- **Where**: `tests/helpers/css-parser.mjs:139-144`
- **Why**: If a button uses CSS variables, `rem` (e.g. `2.75rem`), or `calc()`, `parsePx` evaluates to `0`. While the padding fallback mitigates some cases, it can report false negatives for valid responsive units.
- **Suggestion**: Support rem conversion (`1rem = 16px`) or resolve CSS variables defined in `:root`.

---

## 3. Verified Claims

| Claim / Command | Expected | Actual Result | Status |
|---|---|---|:---:|
| `node tests/runner.mjs --tier=4` | Runs 6 Tier 4 scenarios, exit code 0 | 6/6 passed, 26ms, exit code 0 | **PASS** |
| `node tests/runner.mjs --filter="Consensus"` | Runs 13 tests, exit code 0 | 11 passed, 2 failed (`T1-LOG-05`, `T2-LOG-05`), exit code 1 | **FAIL** |
| `npm test` | Runs 138 tests across 4 tiers | 99 passed, 39 failed, exit code 1 | **FAIL** (as expected pending M1–M4 + TS errors) |
| `npm run typecheck` | `tsc --noEmit` passes with 0 errors | Exits code 2, 2 errors in `TrajectoryCoordinateGraph.tsx` & `MomentsVarianceChart.tsx` | **FAIL** |
| Runner exit code on passing suite | Exit code 0 | Exit code 0 verified on `--tier=4` | **PASS** |
| Runner exit code on failing suite | Exit code 1 | Exit code 1 verified on `--tier=1` and `npm test` | **PASS** |
| Runner exit code on 0 matching tests | Exit code 1 | Verified on `--filter="NonExistentPattern"` | **PASS** |
| Runner `--bail` flag | Stops on first failure | Verified on `node tests/runner.mjs --bail --tier=1` | **PASS** |
| Runner `--verbose` flag | Outputs durations and checks | Verified on `node tests/runner.mjs --tier=4 --verbose` | **PASS** |
| Harness timeout protection | Cancels timer and fails | Verified with 50ms test timeout script | **PASS** |
| Timer leak prevention | `clearTimeout` in `finally` | Verified in `tests/harness.mjs:168` | **PASS** |

---

## 4. Observation

1. **Commands Executed & Raw Outputs**:
   - `node tests/runner.mjs --tier=4`:
     ```text
     ================================================================================
       TIER 4: REAL-WORLD SCENARIOS (WORKFLOWS)
     ================================================================================
       ✔ [T4-SCEN-01] Complete Voter Journey: Landing -> VotePage -> Tap-to-Rank -> Slot Reorder -> Consensus Submit (5ms)
       ✔ [T4-SCEN-02] Pitch Creator Intake Lifecycle: Open Modal -> Enter 450-char Pitch -> Attach Media -> Validate Form (0ms)
       ✔ [T4-SCEN-03] Public Leaderboard & Consensus Conservation Audit: Standings Table Wrapping & 6N Conservation (5ms)
       ✔ [T4-SCEN-04] Adversarial Edge-Case Ballot Handling & Recovery: Duplicate Detection -> Clear Slot -> Re-pick -> Cast (0ms)
       ✔ [T4-SCEN-05] DevWorkbench Staff Moderation Workflow: Table Wrapping & Statistical Moments Calculation (4ms)
       ✔ [T4-SCEN-06] Multi-Device Viewport Audit: Sweep 320px, 375px, 390px, 414px, 768px, 1024px, 1280px (11ms)
       Tier 4 Subtotal: 6/6 passed (100%), 0 failed, 26ms
     Status: ALL TESTS PASSED (Exit Code: 0)
     ```
   - `node tests/runner.mjs --filter="Consensus"`:
     ```text
     [1] TIER 1 › consensus.test.mjs › [T1-LOG-05] TypeScript typechecking completes with 0 errors (tsc --noEmit)
         Error: TypeScript typecheck failed:
     src/components/TrajectoryCoordinateGraph.tsx(243,21): error TS18048: 'xMin' is possibly 'undefined'.
     src/views/DevWorkbench/MomentsVarianceChart.tsx(177,22): error TS2339: Property 'variance' does not exist on type 'EntryMoments'.

     [2] TIER 2 › consensus-bound.test.mjs › [T2-LOG-05] Full production bundle npm run build completes with 0 errors and generates dist/ bundle
         Error: Production build failed:
     src/components/TrajectoryCoordinateGraph.tsx(243,21): error TS18048: 'xMin' is possibly 'undefined'.
     src/views/DevWorkbench/MomentsVarianceChart.tsx(177,22): error TS2339: Property 'variance' does not exist on type 'EntryMoments'.
     Status: TEST SUITE FAILED — 2 test(s) failed (Exit Code: 1)
     ```
   - `npm run typecheck`:
     ```text
     src/components/TrajectoryCoordinateGraph.tsx:243:21 - error TS18048: 'xMin' is possibly 'undefined'.
     src/views/DevWorkbench/MomentsVarianceChart.tsx:177:22 - error TS2339: Property 'variance' does not exist on type 'EntryMoments'.
     Found 2 errors in 2 files. (Exit code: 2)
     ```
   - `npm test`:
     ```text
     Total E2E Suite: 138 total, 99 passed, 39 failed, duration 8617ms. (Exit code: 1)
     ```

2. **Source Code Inspection Observations**:
   - `tests/tier2/reorder-bound.test.mjs`:
     Lines 10-35 define `simulateReorder()`. Lines 38-73 run assertions exclusively against `simulateReorder()`. Line 8 imports `voteAst`, but `voteAst` is not mentioned in any test.
   - `tests/tier1/rank-chips.test.mjs`:
     Lines 11-33 define `createBallotState()`. Lines 44-71 run assertions solely against `createBallotState()`.
   - `tests/tier2/navigation-bound.test.mjs`:
     Lines 19-32 define a loop `for (let i = 0; i < 100; i++) visited.push(...)` and test `visited.length === 100`.
   - `tests/tier2/modal-form-bound.test.mjs`:
     Lines 12-34 define `countWords()` and `validatePitchForm()`. Tests 2, 3, and 5 assert only against these functions.
   - `tests/runner.mjs`:
     Line 88 has `const results = await harness.run({ ... });` outside any `try ... catch`.

---

## 5. Logic Chain

1. **Test Infrastructure Soundness**:
   - The test runner properly implements the arguments specified in `TEST_INFRA.md` (`--tier`, `--verbose`, `--bail`, `--filter`, `-h`).
   - The harness handles asynchronous test execution, wraps timeouts in `Promise.race`, and reliably executes `clearTimeout` in a `finally` block, preventing process hangs.
   - Exit codes strictly adhere to contract: 0 when all tests pass; 1 when any test fails or when 0 tests match a filter.

2. **Integrity Violation Deduction**:
   - Tests `T2-REORD-01` through `T2-REORD-05`, `T1-REORD-02` through `T1-REORD-05`, `T1-RANK-02` through `T1-RANK-05`, `T2-RANK-01` through `T2-RANK-03`, `T2-NAV-01`, and `T2-FORM-02`, `03`, `05` evaluate synthetic helper functions written in the test files themselves.
   - Because these functions are isolated from `src/`, they will pass even if the application code lacks the features completely or contains regressions.
   - Under the mandated review guidelines, dummy/facade implementations and self-certifying work require an explicit verdict of **REQUEST_CHANGES** tagged as an INTEGRITY VIOLATION.

3. **Verification Failure Deduction**:
   - The user request and upstream handoff explicitly required verifying that `npm run typecheck` completes with 0 errors and `node tests/runner.mjs --filter="Consensus"` exits with code 0.
   - Actual execution shows `npm run typecheck` failing with 2 TypeScript errors, and `node tests/runner.mjs --filter="Consensus"` failing with exit code 1.
   - Because the build and typecheck integrity gate is broken, the review cannot approve the current baseline.

---

## 6. Caveats

1. **Concurrently Introduced Typecheck Errors**:
   - File modification timestamps indicate that `src/components/TrajectoryCoordinateGraph.tsx` (13:49:27) and `src/views/DevWorkbench/MomentsVarianceChart.tsx` (13:50:41) were modified after `test_writer_1` authored its report (13:39:09). The typecheck failure was caused by recent changes on the branch, but nonetheless invalidates the claimed passing state.
2. **Pending Implementation Failures**:
   - The remaining 37 failing tests in `npm test` are genuine, intentional contract checks awaiting Milestone 1–4 implementation code (e.g., `.modal-sheet-mobile`, 44px clear buttons, `.table-wrap` on tables). They will transition to green as milestone workers complete their tasks.

---

## 7. Conclusion

- **Verdict**: **REQUEST_CHANGES**
- **Required Actions**:
  1. Fix the 15 self-certifying dummy test cases in `tests/tier1/` and `tests/tier2/` so they assert against actual application ASTs and contracts (`VotePage.tsx`, `App.tsx`, `CreatePitchModal.tsx`).
  2. Fix the 2 TypeScript compiler errors in `src/components/TrajectoryCoordinateGraph.tsx` and `src/views/DevWorkbench/MomentsVarianceChart.tsx` to restore `npm run typecheck` and `npm test -- --filter="Consensus"` to exit code 0.
  3. Wrap `await harness.run(...)` in `tests/runner.mjs` in a `try ... catch` block to ensure robust handling of hook failures.

---

## 8. Verification Method

To independently verify all findings in this report:

1. **Verify Integrity Violation in `reorder-bound.test.mjs`**:
   ```bash
   grep -n "voteAst" /home/yierke/Documents/vote-ui/tests/tier2/reorder-bound.test.mjs
   ```
   *Observation*: `voteAst` appears only on line 8 (import). It is never used in any test assertion.

2. **Verify TypeScript Typecheck Failure**:
   ```bash
   cd /home/yierke/Documents/vote-ui && npm run typecheck
   ```
   *Expected*: Exits with code 2, reporting TS18048 in `TrajectoryCoordinateGraph.tsx` and TS2339 in `MomentsVarianceChart.tsx`.

3. **Verify Consensus Filter Failure**:
   ```bash
   cd /home/yierke/Documents/vote-ui && node tests/runner.mjs --filter="Consensus"
   ```
   *Expected*: Exits with code 1, reporting 2 failed tests (`T1-LOG-05` and `T2-LOG-05`).

4. **Verify Passing Tier 4 Suite**:
   ```bash
   cd /home/yierke/Documents/vote-ui && node tests/runner.mjs --tier=4
   ```
   *Expected*: 6/6 tests pass, exits with code 0.
