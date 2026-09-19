# Handoff Report: E2E Testing Specification & TEST_INFRA.md

**Agent**: `spec_miner_m1_1` (E2E Testing Spec Miner)  
**Parent**: `cad2eebd-1824-4f1e-bd80-53f87985a200` (`sub_orch_e2e_testing`)  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/sub_orch_e2e_testing/spec_miner_m1_1`  
**Target Project File Created**: `/home/yierke/Documents/vote-ui/TEST_INFRA.md`  
**Timestamp**: 2026-09-19T08:00:00Z  
**Type**: Hard Handoff (Task Complete)  

---

## 1. Observation

Direct observations from inspecting authoritative project artifacts:

1. **User Requirements (`ORIGINAL_REQUEST.md`)**:
   - Lines 12–13: *R1. Adaptive Mobile Layout & Responsive Breakpoints*: Scale fluidly without horizontal scrollbars, clipped text, or squished UI on screens from 320px to 768px across Navbar, VotePage, PublicLeaderboard, Pitch Submissions, GrabBox, Guidelines, Docs, DevWorkbench.
   - Lines 15–19: *R2. Touch Ergonomics & Mobile Interaction Patterns*: All tappable elements >=44×44px; transform centered modals (`CreatePitchModal`) to mobile bottom sheets on <768px; optimize 3-slot ranked ballot selector with tap-to-select (`[1st]`, `[2nd]`, `[3rd]`) and quick-reorder controls (`▲`/`▼`).
   - Lines 21–23: *R3. Desktop Preservation & Build Integrity*: Desktop (>=1024px) retains full fidelity, charts, dense telemetry; sound effects and API bindings intact; `npm run typecheck` and `npm run build` succeed with 0 errors.

2. **Project Architecture & Feature Inventory (`PROJECT.md`)**:
   - Lines 4–7: React 18.3.1 (SPA), TypeScript 5.7.3, Vite 6.2.0, `@tanstack/react-query` 5.67.1. Styling: `src/styles.css` vanilla stylesheet with custom properties (`:root`, `[data-theme="light"]`, `[data-theme="dark"]`). Zero Tailwind or PostCSS. Routing: 11 tab views via `activeTab` in `src/App.tsx`.
   - Lines 32–59: 26 discrete features cataloged from M1 to M5 covering tooling, semantic breakpoints, mobile navigation, account popover, wrapper scroll, ballot cards/slots/touch targets, bottom sheets, secondary pages (podium, table wrapping, contrast), and E2E test suite (Features 24, 25, 26).
   - Lines 73–94: Interface contracts established for:
     * Breakpoint boundary: `@media (max-width: 767px)` mobile vs `@media (min-width: 768px)` tablet/desktop.
     * Column flex layout on `.layout-with-sidebar` on mobile; collapsed `.right-nav-rail`.
     * Card selection: `onSelectEntryForVote(entryId, rank)`, `onReorderRank(source, target)`, `onClearSlot(rank)`.
     * Touch targets: `min-width: 44px; min-height: 44px`.
     * Modals: `.modal-sheet-mobile`, `.modal-drag-pill`, `max-height: 85vh`.
     * Table overflow: `.table-wrap` with `overflow-x: auto; -webkit-overflow-scrolling: touch;`.

3. **E2E Testing Scope (`SCOPE.md`)**:
   - Lines 4–11: Opaque-box philosophy independent of internal implementation details. Verification mechanisms: CSS rule analysis, typecheck integrity, domain consensus (`@platform/internal-logic`), viewport layout simulation, end-to-end workflow scenarios.
   - Lines 14–27: 12 testable feature groups defined.
   - Lines 32–34: Milestone targets:
     * E2E-M1: Test Architecture & Runner Harness (`tests/runner.mjs`, `TEST_INFRA.md`).
     * E2E-M2: 4-Tier Test Suite Construction (Tier 1 >=60, Tier 2 >=60, Tier 3 >=12, Tier 4 >=6).
     * E2E-M3: Validation, Audit & `TEST_READY.md`.
   - Lines 37–46: Runner interface: `node tests/runner.mjs`, `--tier=<1|2|3|4|all>`, `--verbose`, exit code 0/1.

4. **Codebase Inspection**:
   - `src/styles.css`: Contains legacy ad-hoc queries at lines 1256 (`max-width: 900px`), 1477 (`800px`), 2217 (`960px`), 2459 (`860px`), 2542 (`680px`), 2762 (`1024px`). Lacks standardized semantic queries (`max-width: 767px`).
   - `src/App.tsx`: Line 189 renders `.layout-with-sidebar` with right rail. Line 203 enforces `page-non-scroll` on `VotePage`.
   - `src/components/CreatePitchModal.tsx`: Line 175 uses inline styles `maxWidth: 560`, button size `width: 30, height: 30` (violating 44px touch guideline), and lacks `.modal-sheet-mobile` / `.modal-drag-pill` classes.
   - `vote-internals/src/validate-ballot.ts`: Line 11 exports `validate_ballot(ballot, validEntrySet)` checking voterId, 3 non-empty slots, anti-stacking (`rank1 === rank2`, etc.), and valid entry set. Line 29 of `types.ts` defines `POINTS_PER_BALLOT = 6`.

---

## 2. Logic Chain

1. **Opaque-Box Testing Strategy**:
   - Unit tests that shallow-render React components or inspect private component state are fragile and fail when refactoring JSX structures.
   - In contrast, asserting CSS rules (`@media (max-width: 767px)`, `min-width: 44px`), accessibility roles (`aria-label`, `role="navigation"`), DOM class invariants (`.table-wrap`, `.modal-sheet-mobile`), and executing `@platform/internal-logic` directly tests observable external contracts.
   - Running in standalone Node.js (`v26.7.0`) avoids slow headless browser startup, sandbox flakiness, and heavy dependencies.

2. **Mapping 26 Features into 12 Feature Groups**:
   - The 26 features from `PROJECT.md` naturally cluster into 12 coherent functional groups as structured in `SCOPE.md`:
     * Breakpoints (Feat 2, 23)
     * Mobile Navigation (Feat 3)
     * Overflow Elimination (Feat 5, 22)
     * Scroll Unlocking (Feat 5, 6)
     * Tap-to-Rank Chips (Feat 7)
     * Slot Reorder Chevrons (Feat 8)
     * 44×44px Touch Targets (Feat 9, 13, 20)
     * Mobile Bottom Sheet Dialogs (Feat 12, 14)
     * Modal Form Ergonomics (Feat 4, 13, 14)
     * Secondary Views Responsiveness (Feat 15, 16, 17, 18, 19, 20, 21)
     * Sound & Media Policy (Feat 10)
     * Consensus Logic & Build Integrity (Feat 1, 11, 24, 25, 26)
   - Every single feature from `PROJECT.md` is explicitly tested.

3. **Coverage Tier Calculation**:
   - **Tier 1 (Feature Coverage / Happy Paths)**: 12 feature groups × 5 tests each = **60 tests**.
   - **Tier 2 (Boundary & Corner Cases)**: 12 feature groups × 5 tests each = **60 tests**.
   - **Tier 3 (Cross-Feature Interactions / Pairwise)**: 12 orthogonal pairwise combinations = **12 tests**.
   - **Tier 4 (Real-World Scenarios / Workflows)**: 6 end-to-end multi-step synthetic user sessions = **6 tests**.
   - **Total Test Suite**: 60 + 60 + 12 + 6 = **138 tests**.
   - Pass Criterion: 100% (138/138 passing, 0 failures allowed).

---

## 3. Specification Miner Tables

### Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Tooling | Tooling & Typecheck Script | Add `"typecheck": "tsc --noEmit"` to `package.json` | CLI `npm run typecheck` | Exit code 0, 0 type errors | Non-zero exit code on TS error | PROJECT.md Feat 1 |
| 2 | Layout | Semantic Responsive Breakpoints | Breakpoints `<768px` (mobile), `768-1023px` (tablet), `>=1024px` (desktop) | Viewport widths 320px–1280px | Appropriate responsive layout styling | Layout breakage if unhandled | PROJECT.md Feat 2 / R1 |
| 3 | Navigation | Mobile Navigation Pattern | Bottom bar or header drawer replacing 64px right rail on `<768px` | Tap tab icons/buttons | Route transition via `handleTabChange` | State preserved if invalid tab | PROJECT.md Feat 3 / R1 |
| 4 | Layout | Account Popover Positioning | Reposition account overview popover so it does not render at negative X | Viewport width 320px | Popover strictly within viewport bounds | Clipped if unhandled | PROJECT.md Feat 4 |
| 5 | Layout | Page Wrapper Mobile Scroll Unlocking | Allow `overflow-y: auto` on `.page-view-wrapper` on viewports `<1024px` | Viewport `<1024px` | Vertical scrolling unlocked | Content unreachable if locked | PROJECT.md Feat 5 / R1 |
| 6 | Voting | Vote Page Mobile Layout Fix | Remove 100vh lock so ballot slots and Cast Vote button are reachable | Viewport `<1024px` on VotePage | Ballot slots scroll into view | Lockout if 100vh remains | PROJECT.md Feat 6 / R1 |
| 7 | Voting | Inline Tap-to-Rank Card Controls | Add `[1st]`, `[2nd]`, `[3rd]` tap chips directly on candidate cards | Tap chip event | Candidate assigned to rank slot (1, 2, or 3) | Idempotent on repeated taps | PROJECT.md Feat 7 / R2 |
| 8 | Voting | Touch Reorder Controls on Slots | Up/Down chevrons (`▲`/`▼`) on filled ballot slots for one-handed usage | Tap Up/Down chevron | Candidate slots swapped | Disabled at slot bounds (1 Up, 3 Down) | PROJECT.md Feat 8 / R2 |
| 9 | Ergonomics | 44×44px Touch Targets on Vote Page | Enlarge slot clear buttons, thought bubble trigger, action buttons | Pointer/touch event | Target dimensions >=44×44px | Mis-taps if smaller | PROJECT.md Feat 9 / R2 |
| 10 | Media | Audio & Media Policy Preservation | Maintain SoundEngine contracts, mute thumbnail videos, full controls on detail | User actions, video renders | Audio playback, video controls | AudioContext blocked handled gracefully | PROJECT.md Feat 10 / R3 |
| 11 | Logic | Ballot Validation & Consensus Integrity | Enforce 6 points, anti-stacking, active round in `@platform/internal-logic` | Ballot `{ voterId, rank1, rank2, rank3 }` | `{ isValid: true, errors: [] }` | Rejection with specific error message | PROJECT.md Feat 11 / R3 |
| 12 | Modals | CreatePitchModal Mobile Bottom Sheet | Transform centered modal to bottom-anchored sheet on `<768px` with drag pill | Viewport `<768px`, modal open | `.modal-sheet-mobile`, bottom: 0, pill | Centered desktop if `>=1024px` | PROJECT.md Feat 12 / R2 |
| 13 | Ergonomics | Mobile Modal Form Touch Ergonomics | 44×44px close button, character counter, stacked submit/cancel buttons | Form inputs | Stacked buttons, live counter | Validation error if empty/overflow | PROJECT.md Feat 13 / R2 |
| 14 | Ergonomics | Dialogs & Popups Touch Ergonomics | `CreateRoundModal`, `CommandPalette`, popovers follow mobile sheet standards | Viewport `<768px` | Mobile sheet styling, 44px buttons | Fallback desktop on `>=1024px` | PROJECT.md Feat 14 / R2 |
| 15 | Leaderboard | PublicLeaderboard Mobile Podium Order | Reorder columns so Gold (1st) renders before Silver (2nd) and Bronze (3rd) | Viewport `<768px` | 1st place stacked at top | 2nd/1st/3rd desktop preserved | PROJECT.md Feat 15 / R1 |
| 16 | Leaderboard | PublicLeaderboard Standings Table | Responsive table scroll wrapping via `.table-wrap` on small screens | Viewport `<640px` | Horizontal table scroll inside wrapper | Document blowout if unwrapped | PROJECT.md Feat 16 / R1 |
| 17 | Docs | DocsPage Responsive Layout | Collapse inline `1fr 300px` grid to 1 column; wrap 4 spec tables | Viewport `<768px` | 1-column layout, table scrolling | Grid overflow if uncollapsed | PROJECT.md Feat 17 / R1 |
| 18 | Settings | SettingsPage Responsive Layout | Collapse 280px sidebar to 1 column on `<768px` with sticky scroll chips | Viewport `<768px` | 1-column layout, horizontal chips | Sidebar overlap if uncollapsed | PROJECT.md Feat 18 / R1 |
| 19 | Progress | ProgressPage Responsive Timeline | Make 17-sub-stage milestone track responsive (horizontal scroll/wrap) | Viewport `<768px` | Responsive track, stacked inputs | Truncated milestone if rigid | PROJECT.md Feat 19 / R1 |
| 20 | DevWorkbench| DevWorkbench Wide Table Wrapping | Wrap 980px & 1140px telemetry tables in `.table-wrap`; 44px actions | Viewport `<1024px` | Local horizontal table scroll | Horizontal page scroll if unwrapped | PROJECT.md Feat 20 / R1 |
| 21 | Telemetry | Telemetry Light-Mode Contrast Fix | Fix hardcoded `#f8fafc` text in `RaidTelemetryChart.tsx` to `var(--text-main)` | Theme toggle: light | High-contrast readable text | Unreadable white text on white bg | PROJECT.md Feat 21 |
| 22 | Layout | Horizontal Scroll Elimination (320-768px) | Zero horizontal overflow across all application routes | Viewports 320px–768px | Document scrollWidth === clientWidth | Horizontal scrollbar if overflowing | PROJECT.md Feat 22 / R1 |
| 23 | Desktop | Desktop Fidelity Preservation (>=1024px) | Retain full fidelity, charts, dense telemetry, infobox, 3D podium | Viewports `>=1024px` | Full multi-column desktop layout | Mobile layout degradation on desktop | PROJECT.md Feat 23 / R3 |
| 24 | Testing | Opaque-box E2E Test Suite (Tiers 1-4) | Comprehensive test runner and harness covering 4 tiers (138 tests) | `node tests/runner.mjs` | Tier breakdown, exit code 0 | Exit code 1 on failure | PROJECT.md Feat 24 / SCOPE.md |
| 25 | Hardening | Adversarial Coverage Hardening (Tier 5) | White-box stress-testing and edge-case verification via Challengers | Edge payloads, rapid mutations | Invariant preservation | Fails if edge case breaks system | PROJECT.md Feat 25 / SCOPE.md |
| 26 | Build | Build & Typecheck Zero Error Guarantee | `npm run typecheck && npm run build` complete with 0 errors | Build pipeline invocation | Exit code 0, clean `dist/` | Compiler/bundler error stops pipeline | PROJECT.md Feat 26 / R3 |

### Edge Cases
| # | Feature | Input | Observed / Required Behavior |
|---|---------|-------|------------------------------|
| 1 | Breakpoints | Viewport at exact boundary 767px | Must activate mobile CSS rules (`max-width: 767px`) and hide desktop rail. |
| 2 | Breakpoints | Viewport at exact boundary 768px | Must activate tablet/desktop CSS rules (`min-width: 768px`) and hide mobile nav. |
| 3 | Breakpoints | Viewport at absolute minimum 320px | Must render with 0px horizontal document overflow across all 11 views. |
| 4 | Ballot Validation | Missing `voterId` | Rejects with error: "Missing voterId. Who cast this ballot?". |
| 5 | Ballot Validation | Partial ballot (e.g. `rank3` empty) | Rejects with error: "3rd place (1-point slot) is empty". |
| 6 | Ballot Validation | Self-stacking (`rank1 === rank2`) | Rejects with anti-stacking error; prevents hoarding all 6 points on one entry. |
| 7 | Ballot Validation | Candidate ID not in active round | Rejects with error indicating candidate is not in active catalog. |
| 8 | Pitch Submission | Description > 1500 characters | Blocks submission; highlights character counter in warning/error state. |
| 9 | Pitch Submission | Description or Title empty / whitespace | Blocks submission before network call; displays client validation error. |
| 10 | Media Upload | File size > 5 MB | Blocks upload; triggers error: "File exceeds maximum size of 5 MB." |
| 11 | Reorder Chevrons | Tapping Up on Slot 1 | Disabled or no-op (candidate cannot be reordered above 1st place). |
| 12 | Reorder Chevrons | Tapping Down on Slot 3 | Disabled or no-op (candidate cannot be reordered below 3rd place). |
| 13 | Reorder Chevrons | Reordering into an empty slot | Moves candidate to adjacent empty slot without duplication. |
| 14 | Popovers | Account popover opened at x=0 on 320px | Positions strictly within [0, 320px] bounds; no negative X coordinates. |
| 15 | Audio Context | Browser blocks audio autoplay | Sound engine catches AudioContext rejection silently; no unhandled promise crash. |
| 16 | Reduced Motion | User enables `reducedMotion` in settings | `BlazeTransitionOverlay` is bypassed; route switching occurs instantly. |

---

## 4. Canonical TEST_INFRA.md Specification

The authoritative specification file has been generated and written directly to `/home/yierke/Documents/vote-ui/TEST_INFRA.md`. Its complete text is reproduced below for self-contained reference:

```markdown
# End-to-End Test Infrastructure Specification (TEST_INFRA.md)

**Project**: `vote-ui` Modernization & Responsive Mobile Refactoring  
**Author**: E2E Testing Track (`spec_miner_m1_1`)  
**Target Path**: `/home/yierke/Documents/vote-ui/TEST_INFRA.md`  
**Date**: 2026-09-19  
**Status**: ACTIVE / CANONICAL SPECIFICATION  

---

## 1. Test Philosophy & Architecture

### 1.1 Opaque-Box Testing Philosophy
The `vote-ui` E2E testing framework operates strictly on **opaque-box principles**. Rather than coupling assertions to internal component implementations, volatile state variables, or private helper functions, the test suite verifies **external behavioral contracts, observable DOM/CSS invariants, accessibility standards, design system rules, and mathematical consensus guarantees**:

1. **Contract-Driven Verification**: Asserts conformance against public interfaces defined in `PROJECT.md` and user requirements from `ORIGINAL_REQUEST.md` (R1: Mobile Layout, R2: Touch Ergonomics, R3: Desktop Preservation & Build Integrity).
2. **Zero Brittle Browser Dependencies**: Unlike heavy, flaking headless browser frameworks (e.g. Puppeteer/Playwright) that require complex binary downloads and unstable GPU emulation in CI/CD sandbox environments, our runner uses a high-speed, deterministic Node.js harness. It combines static AST/CSS rule analysis, simulated DOM tree evaluation, media property validation, and live execution of the domain consensus calculation engine (`@platform/internal-logic`).
3. **No Hardcoded/Dummy Workarounds**: Tests actively inspect actual project files (`src/styles.css`, `src/App.tsx`, `src/views/VoterApp/VotePage.tsx`, `src/components/CreatePitchModal.tsx`, `package.json`), ensuring production assets genuinely satisfy constraints rather than returning synthetic mock stubs.

### 1.2 Verification Mechanisms
The test infrastructure employs five distinct verification vectors:
- **CSS Rule & Breakpoint Analyzer**: Verifies semantic media query breakpoints (`<768px`, `768-1023px`, `>=1024px`), container queries, flex/grid directions, overflow locks, and 44×44px touch targets directly from stylesheet rules.
- **Component Interface & Contract Auditor**: Verifies prop signatures, event handlers (`onSelectRank`, `onReorderRank`, `onClearSlot`), aria attributes, bottom-sheet classes (`.modal-sheet-mobile`, `.modal-drag-pill`), and character counter mechanics.
- **Domain Consensus & Logic Engine**: Directly imports and executes `@platform/internal-logic` methods (`validateBallot`, `RANK_WEIGHTS`, `POINTS_PER_BALLOT`, `calculate_moments_and_variance`) against candidate ballots to verify the 6-point distribution, anti-stacking invariants, and Bayesian consensus integrity.
- **Multi-Viewport Simulation**: Evaluates layout constraints across canonical device widths: 320px (iPhone SE minimum), 375px (standard mobile), 414px (phablet), 768px (tablet breakpoint boundary), and 1024px (desktop fidelity threshold).
- **Type & Build Verification**: Integrates `tsc --noEmit` and Vite production bundling to guarantee zero TypeScript or build regression.

---

## 2. Coverage Tiers Architecture

The test suite is structured into four progressive tiers designed to test features from isolated happy paths up to full real-world scenarios:

```
┌─────────────────────────────────────────────────────────────────┐
│                   TIER 4: REAL-WORLD SCENARIOS                  │
│       Multi-step voter journeys, pitch lifecycle, moderation    │
├─────────────────────────────────────────────────────────────────┤
│               TIER 3: CROSS-FEATURE INTERACTIONS                │
│    Pairwise combinations (modal+nav, theme+ballot, audio+vote)  │
├─────────────────────────────────────────────────────────────────┤
│               TIER 2: BOUNDARY & CORNER CASES                   │
│   320px viewports, 1500-char limits, anti-stacking, empty slots │
├─────────────────────────────────────────────────────────────────┤
│                   TIER 1: FEATURE COVERAGE                      │
│      Happy paths, baseline requirements (>=5 per feature group) │
└─────────────────────────────────────────────────────────────────┘
```

- **Tier 1: Feature Coverage (Happy Paths)**: Verifies the positive baseline behavior of every single feature under standard operating conditions. Each of the 12 feature groups requires at least 5 discrete test cases (minimum 60 tests).
- **Tier 2: Boundary & Corner Cases**: Stress-tests edge conditions, boundary viewports (320px, 767px, 768px, 1023px, 1024px), extreme inputs (0 chars, 1500 chars limit, >5MB uploads), ballot slot collisions, empty round pools, and rapid state mutations. Requires at least 5 test cases per feature group (minimum 60 tests).
- **Tier 3: Cross-Feature Interactions (Pairwise Combinations)**: Evaluates orthogonal subsystem pairings to catch emergent side effects (e.g. theme switching while ballot slots are occupied; opening modals during route transitions; muting audio during ballot submission; resizing viewport with an open drawer). Requires at least 12 distinct tests.
- **Tier 4: Real-World Scenarios (End-to-End Workflows)**: Simulates complete, multi-step synthetic user sessions from initial landing through voting, pitch creation, leaderboard audit, and moderation. Requires at least 6 comprehensive workflow scenarios.

---

## 3. Feature Inventory & Mapping

All 26 features cataloged in `PROJECT.md` and user requirements R1–R3 in `ORIGINAL_REQUEST.md` map to 12 Core Testable Feature Groups:

| Group # | Testable Feature Group | PROJECT.md Features | ORIGINAL_REQUEST.md | Assigned Tiers |
|:-------:|:-----------------------|:-------------------:|:-------------------:|:--------------:|
| **G1**  | Responsive Breakpoints & Layout | Feat 2, 23 | R1, R3 | Tiers 1, 2, 3, 4 |
| **G2**  | Mobile Navigation Pattern | Feat 3 | R1 | Tiers 1, 2, 3, 4 |
| **G3**  | Horizontal Overflow Elimination | Feat 5, 22 | R1 | Tiers 1, 2, 4 |
| **G4**  | Page Wrapper Scroll Unlocking | Feat 5, 6 | R1 | Tiers 1, 2 |
| **G5**  | Inline Tap-to-Rank Card Controls | Feat 7 | R2 | Tiers 1, 2, 3, 4 |
| **G6**  | Touch Reorder Controls on Slots | Feat 8 | R2 | Tiers 1, 2, 3, 4 |
| **G7**  | 44×44px Touch Target Compliance | Feat 9, 13, 20 | R2 | Tiers 1, 2 |
| **G8**  | Mobile Bottom Sheet Dialogs | Feat 12, 14 | R2 | Tiers 1, 2, 3, 4 |
| **G9**  | Mobile Modal Form Ergonomics | Feat 4, 13, 14 | R2 | Tiers 1, 2, 3, 4 |
| **G10** | Secondary Views Responsiveness | Feat 15, 16, 17, 18, 19, 20, 21 | R1 | Tiers 1, 2, 3, 4 |
| **G11** | Sound & Media Policy Preservation | Feat 10 | R3 | Tiers 1, 2, 3, 4 |
| **G12** | Consensus Logic & Build Integrity | Feat 1, 11, 24, 25, 26 | R3 | Tiers 1, 2, 3, 4 |

---

## 4. Test Case Catalog

### 4.1 Tier 1: Feature Coverage (60 Happy-Path Tests)

#### Group 1: Responsive Breakpoints & Layout Architecture (Feat 2, 23)
- `T1-RESP-01`: Standard mobile media query `@media (max-width: 767px)` is defined in `src/styles.css`.
- `T1-RESP-02`: Tablet media query `@media (min-width: 768px)` is defined in `src/styles.css`.
- `T1-RESP-03`: Desktop media query `@media (min-width: 1024px)` is defined in `src/styles.css`.
- `T1-RESP-04`: `.layout-with-sidebar` applies `flex-direction: row` on desktop (>=1024px).
- `T1-RESP-05`: `.layout-with-sidebar` applies `flex-direction: column` on mobile (<768px).

#### Group 2: Mobile Navigation Pattern (Feat 3)
- `T1-NAV-01`: Mobile navigation element (`MobileNavBar` or mobile nav bar container) renders on viewports <768px.
- `T1-NAV-02`: Right navigation rail `.right-nav-rail` is hidden (`display: none`) on viewports <768px.
- `T1-NAV-03`: Primary route buttons (`landing`, `ballot`, `leaderboard`) are present in mobile navigation.
- `T1-NAV-04`: Selecting a mobile nav button invokes `handleTabChange` with the target `NavTabId`.
- `T1-NAV-05`: Currently active tab displays active styling state (class `active` or aria-current).

#### Group 3: Horizontal Overflow Elimination (Feat 5, 22)
- `T1-OVR-01`: Root container `.app-root-layout` enforces `overflow-x: hidden` and `max-width: 100vw`.
- `T1-OVR-02`: Global `.table-wrap` utility class exists with `overflow-x: auto` and `width: 100%`.
- `T1-OVR-03`: Landing page container layout fits within standard 375px mobile viewport without overflow.
- `T1-OVR-04`: Candidate pitch cards wrap cleanly within 375px viewport width.
- `T1-OVR-05`: PublicLeaderboard container width is constrained to 100% without horizontal document overflow.

#### Group 4: Page Wrapper Scroll Unlocking (Feat 5, 6)
- `T1-SCRL-01`: `.page-view-wrapper` sets `overflow-y: auto` on viewports <1024px.
- `T1-SCRL-02`: `page-non-scroll` class does not lock vertical scrolling on mobile (<1024px).
- `T1-SCRL-03`: VotePage scroll container allows scrolling past candidate cards down to ballot slots.
- `T1-SCRL-04`: Cast Ballot submission button is fully reachable via scrolling on mobile viewports.
- `T1-SCRL-05`: Switching navigation tabs resets window scroll position to top (`scrollTo(0, 0)`).

#### Group 5: Inline Tap-to-Rank Card Controls (Feat 7)
- `T1-RANK-01`: Candidate cards display inline tap chips `[1st]`, `[2nd]`, and `[3rd]`.
- `T1-RANK-02`: Tapping `[1st]` chip invokes `onSelectRank(1, entryId)` and places candidate into rank 1.
- `T1-RANK-03`: Tapping `[2nd]` chip invokes `onSelectRank(2, entryId)` and places candidate into rank 2.
- `T1-RANK-04`: Tapping `[3rd]` chip invokes `onSelectRank(3, entryId)` and places candidate into rank 3.
- `T1-RANK-05`: Tap chip displays highlighted/selected state when candidate currently occupies that rank.

#### Group 6: Touch Reorder Controls on Slots (Feat 8)
- `T1-REORD-01`: Filled ballot slot 2 renders both Up (`▲`) and Down (`▼`) reorder chevron buttons.
- `T1-REORD-02`: Tapping Up chevron on slot 2 swaps occupants of rank 1 and rank 2.
- `T1-REORD-03`: Tapping Down chevron on slot 2 swaps occupants of rank 2 and rank 3.
- `T1-REORD-04`: Tapping Down chevron on slot 1 swaps occupants of rank 1 and rank 2.
- `T1-REORD-05`: Tapping Up chevron on slot 3 swaps occupants of rank 3 and rank 2.

#### Group 7: 44×44px Touch Target Compliance (Feat 9, 13, 20)
- `T1-TOUCH-01`: Mobile navigation items have minimum dimensions of 44×44px (or padding area >=44px).
- `T1-TOUCH-02`: Clear slot buttons on filled ballot slots declare `min-width: 44px; min-height: 44px`.
- `T1-TOUCH-03`: Up/Down reorder chevrons on ballot slots provide minimum 44×44px tappable target area.
- `T1-TOUCH-04`: Modal close button (`.icon-btn` or close trigger) provides minimum 44×44px touch area.
- `T1-TOUCH-05`: Primary action buttons (Cast Ballot, Submit Pitch) have minimum height >=44px.

#### Group 8: Mobile Bottom Sheet Dialogs (Feat 12, 14)
- `T1-SHEET-01`: `CreatePitchModal` applies `.modal-sheet-mobile` styling on viewports <768px.
- `T1-SHEET-02`: Mobile bottom sheet renders a top drag handle/pill (`.modal-drag-pill`).
- `T1-SHEET-03`: Mobile bottom sheet is anchored to bottom of viewport (`bottom: 0`).
- `T1-SHEET-04`: Mobile bottom sheet features top-left and top-right border radiuses (`border-top-left-radius`).
- `T1-SHEET-05`: Mobile bottom sheet restricts max height to `85vh` with inner vertical scrolling (`overflow-y: auto`).

#### Group 9: Mobile Modal Form Ergonomics (Feat 4, 13, 14)
- `T1-FORM-01`: Modal form action buttons (Submit / Cancel) stack in a full-width column on mobile (<768px).
- `T1-FORM-02`: Real-time character counter displays current count and maximum limit (`0 / 1500`).
- `T1-FORM-03`: File upload input supports selecting image/video with preview rendering.
- `T1-FORM-04`: Close button invokes `onClose` callback to dismiss modal.
- `T1-FORM-05`: Account popover dropdown renders within visible viewport coordinates on mobile.

#### Group 10: Secondary Views Responsiveness (Feat 15, 16, 17, 18, 19, 20, 21)
- `T1-SEC-01`: `PublicLeaderboard` mobile podium displays Gold (1st) above/before Silver and Bronze on <768px.
- `T1-SEC-02`: `DocsPage` sidebar grid collapses from `1fr 300px` to a single column on <768px.
- `T1-SEC-03`: `SettingsPage` 280px sidebar layout collapses to single column on <768px.
- `T1-SEC-04`: `DevWorkbench` wide telemetry tables are enclosed in `.table-wrap` containers.
- `T1-SEC-05`: `ProgressPage` milestone track scales fluidly without overflowing mobile viewport.

#### Group 11: Sound & Media Policy Preservation (Feat 10)
- `T1-SND-01`: Sound utility exports `playPop`, `playReset`, `playLevelUp`, and `playLockIn` methods.
- `T1-SND-02`: Interacting with tap-to-rank chip triggers audio playback invocation.
- `T1-SND-03`: Clearing a ballot slot invokes `sounds.playReset()`.
- `T1-SND-04`: Candidate pitch card thumbnail videos include the `muted` attribute.
- `T1-SND-05`: Candidate detail modal videos include `controls` attribute for user playback control.

#### Group 12: Consensus Logic & Build Integrity (Feat 1, 11, 24, 25, 26)
- `T1-LOG-01`: `package.json` specifies `"typecheck": "tsc --noEmit"` in scripts.
- `T1-LOG-02`: `validateBallot` returns `{ isValid: true, errors: [] }` for a valid 3-candidate ballot.
- `T1-LOG-03`: `RANK_WEIGHTS` maps rank 1 to 3 pts, rank 2 to 2 pts, rank 3 to 1 pt.
- `T1-LOG-04`: Total points per ballot equals exactly 6 (`POINTS_PER_BALLOT = 6`).
- `T1-LOG-05`: TypeScript typechecking completes with 0 errors (`tsc --noEmit`).

---

### 4.2 Tier 2: Boundary & Corner Cases (60 Edge Tests)

#### Group 1: Responsive Breakpoints & Layout Architecture (Feat 2, 23)
- `T2-RESP-01`: Viewport at exactly 320px width renders column layout without horizontal document overflow.
- `T2-RESP-02`: Viewport at boundary 767px activates mobile rules and suppresses desktop sidebar rail.
- `T2-RESP-03`: Viewport at boundary 768px activates tablet rules and suppresses mobile bottom bar.
- `T2-RESP-04`: Viewport at boundary 1023px retains tablet responsive adjustments.
- `T2-RESP-05`: Viewport at boundary 1024px restores full desktop layout density and 64px vertical right rail.

#### Group 2: Mobile Navigation Pattern (Feat 3)
- `T2-NAV-01`: Rapidly switching between all 11 views does not corrupt routing state or cause memory leaks.
- `T2-NAV-02`: Mobile navigation padding accounts for safe-area insets without obscuring bottom action buttons.
- `T2-NAV-03`: Mobile navigation tab labels at 320px viewport do not wrap or truncate destructively.
- `T2-NAV-04`: Direct navigation to legal sub-routes (`privacy`, `terms`, `guidelines`) correctly updates active state.
- `T2-NAV-05`: Mobile navigation elements include valid `aria-label` and `role="navigation"` attributes.

#### Group 3: Horizontal Overflow Elimination (Feat 5, 22)
- `T2-OVR-01`: Viewport at 320px produces 0px horizontal scroll on all 11 routes.
- `T2-OVR-02`: All 4 specification tables in `DocsPage` are wrapped in `.table-wrap` to prevent document blowout.
- `T2-OVR-03`: DevWorkbench 980px and 1140px telemetry tables scroll horizontally within `.table-wrap` on 320px.
- `T2-OVR-04`: Extra-long pitch titles (>100 characters with no spaces) break cleanly via `overflow-wrap: break-word`.
- `T2-OVR-05`: Viewport at boundary 767px maintains exactly 0px horizontal document overflow.

#### Group 4: Page Wrapper Scroll Unlocking (Feat 5, 6)
- `T2-SCRL-01`: Short viewports (320×480px) allow complete scrolling through candidate roller, slots, and submit button.
- `T2-SCRL-02`: Desktop viewports (>=1024px) preserve fixed single-screen layout without spurious body scrollbars.
- `T2-SCRL-03`: Dynamic mobile address bar height fluctuations (`dvh` vs `vh`) do not clip bottom submit actions.
- `T2-SCRL-04`: Fast mouse wheel / touch flick on candidate roller does not trigger scroll trapping.
- `T2-SCRL-05`: Navigating deep into `DocsPage` or `SettingsPage` sub-tabs maintains smooth vertical scroll without clipping.

#### Group 5: Inline Tap-to-Rank Card Controls (Feat 7)
- `T2-RANK-01`: Tapping `[1st]` on candidate already in `rank2` executes a clean swap without creating duplicate ranks.
- `T2-RANK-02`: Tapping `[1st]` on candidate already in `rank1` is an idempotent safe no-op.
- `T2-RANK-03`: Rapidly tapping multiple rank chips in succession guarantees invariant of at most 1 candidate per slot.
- `T2-RANK-04`: Tap chips display descriptive screen-reader labels (`Rank 1st`, `Rank 2nd`, `Rank 3rd`).
- `T2-RANK-05`: Candidate card action row with tap chips fits within 320px width without overlapping candidate metadata.

#### Group 6: Touch Reorder Controls on Slots (Feat 8)
- `T2-REORD-01`: Slot 1 Up chevron (`▲`) is disabled or omitted (cannot reorder above rank 1).
- `T2-REORD-02`: Slot 3 Down chevron (`▼`) is disabled or omitted (cannot reorder below rank 3).
- `T2-REORD-03`: Empty ballot slot disables or hides reorder chevrons.
- `T2-REORD-04`: Reordering an occupied slot into an empty adjacent slot moves the occupant cleanly.
- `T2-REORD-05`: Rapid alternating taps on Up/Down chevrons preserves candidate IDs without slot collision.

#### Group 7: 44×44px Touch Target Compliance (Feat 9, 13, 20)
- `T2-TOUCH-01`: Inline tap-to-rank chips on candidate cards maintain >=44×44px touch area on 320px viewport.
- `T2-TOUCH-02`: Thought bubble / candidate detail inspection trigger provides minimum 44×44px touch target.
- `T2-TOUCH-03`: DevWorkbench moderation action buttons (Approve, Reject, Purge) meet >=44px height.
- `T2-TOUCH-04`: Adjacent touch targets have >=8px separation to prevent accidental adjacent activation.
- `T2-TOUCH-05`: Settings dropdown trigger in mobile navbar maintains >=44×44px touch dimensions.

#### Group 8: Mobile Bottom Sheet Dialogs (Feat 12, 14)
- `T2-SHEET-01`: Desktop viewport (>=1024px) retains centered floating modal dialog without `.modal-sheet-mobile`.
- `T2-SHEET-02`: Tapping the backdrop overlay outside bottom sheet invokes `onClose` callback.
- `T2-SHEET-03`: Tapping inside bottom sheet card does not bubble up to backdrop (`stopPropagation`).
- `T2-SHEET-04`: When virtual keyboard opens on mobile, bottom sheet contents remain vertically scrollable.
- `T2-SHEET-05`: `CreateRoundModal` and `CommandPalette` adopt responsive mobile sheet constraints on <768px.

#### Group 9: Mobile Modal Form Ergonomics (Feat 4, 13, 14)
- `T2-FORM-01`: Character counter turns warning/error styling when description exceeds `MAX_CHAR_LIMIT` (1500 chars).
- `T2-FORM-02`: Submitting form with empty title or empty description triggers validation error before network call.
- `T2-FORM-03`: Uploading media file exceeding 5MB displays rejection notice (`File exceeds maximum size of 5 MB`).
- `T2-FORM-04`: Account popover dropdown on 320px viewport maintains `left >= 0` and `right <= 320px`.
- `T2-FORM-05`: Word counter correctly handles multi-whitespace strings and returns 0 words on empty string.

#### Group 10: Secondary Views Responsiveness (Feat 15, 16, 17, 18, 19, 20, 21)
- `T2-SEC-01`: Telemetry chart in `RaidTelemetryChart.tsx` uses `var(--text-main)` instead of `#f8fafc` in light mode.
- `T2-SEC-02`: PublicLeaderboard standings table on 320px viewport allows horizontal scroll without page blowout.
- `T2-SEC-03`: DocsPage Wikipedia-style infobox wraps cleanly without overflowing 320px screen width.
- `T2-SEC-04`: SettingsPage sub-tab chips on mobile remain horizontally scrollable without clipping active indicator.
- `T2-SEC-05`: Desktop viewports (>=1024px) retain 3D podium layout with 2nd place left, 1st center, 3rd right.

#### Group 11: Sound & Media Policy Preservation (Feat 10)
- `T2-SND-01`: Sound methods catch and suppress unhandled AudioContext playback rejections silently.
- `T2-SND-02`: Toggling user sound setting to muted suppresses all `sounds.*` audio triggers.
- `T2-SND-03`: Thumbnail videos include `playsInline` attribute to prevent unwanted iOS Safari full-screen hijack.
- `T2-SND-04`: Submitting an incomplete/invalid ballot suppresses `playLevelUp()` success chime.
- `T2-SND-05`: Unmounting modal components revokes temporary blob object URLs (`URL.revokeObjectURL`).

#### Group 12: Consensus Logic & Build Integrity (Feat 1, 11, 24, 25, 26)
- `T2-LOG-01`: `validateBallot` rejects ballot with empty or whitespace-only `voterId`.
- `T2-LOG-02`: `validateBallot` rejects ballot missing any slot (e.g. `rank3` empty).
- `T2-LOG-03`: `validateBallot` enforces anti-stacking and rejects ballot where `rank1 === rank2`.
- `T2-LOG-04`: `validateBallot` rejects ballot where candidate ID is not in active round's `validEntrySet`.
- `T2-LOG-05`: Full production bundle `npm run build` completes with 0 errors and generates `dist/` bundle.

---

### 4.3 Tier 3: Cross-Feature Interactions (12 Pairwise Tests)

- `T3-INT-01`: **Mobile Navigation + Bottom Sheet Modal**: Navigating to another route via mobile navbar while `CreatePitchModal` is open dismisses the modal cleanly and transitions to the target view.
- `T3-INT-02`: **Theme Switching + Ranked Ballot Slots**: Switching theme between light and dark updates CSS variables (`--bg-card`, `--text-main`, `--border-subtle`) without corrupting ballot slot selection state or visual contrast.
- `T3-INT-03`: **Audio Engine + Ballot Submission**: Submitting a valid ballot plays `playLevelUp()` chime when sound is enabled, but produces zero audio output when user sound preference is disabled.
- `T3-INT-04`: **Tap-to-Rank Chips + Slot Reorder Chevrons**: Interleaving candidate tap chips and slot Up/Down reorder chevrons maintains strict candidate uniqueness and valid 3-slot ordering.
- `T3-INT-05`: **Viewport Resize + Open Modal**: Resizing viewport dynamically from desktop (1280px) to mobile (375px) converts the centered modal into a bottom sheet without clearing form inputs.
- `T3-INT-06`: **Command Palette + Mobile Route Navigation**: Invoking Command Palette on mobile renders touch-friendly results; selecting an item navigates to the view and closes the palette.
- `T3-INT-07`: **Media Preview + Pitch Form Validation**: Attaching an image generates a WebP preview; submitting without a title correctly surfaces the validation error while retaining the media file.
- `T3-INT-08`: **Ballot Submission + PublicLeaderboard Consensus**: Casting a ballot updates the live leaderboard query, incrementing `totalBallots` by 1 and `totalPointsAwarded` by exactly 6.
- `T3-INT-09`: **DocsPage Tables + Mobile Viewport**: Viewing DocsPage specification tables on 360px viewport allows table horizontal scrolling inside `.table-wrap` while document root remains locked to 0px horizontal scroll.
- `T3-INT-10`: **DevWorkbench Telemetry + Light-Mode Contrast**: In light mode, telemetry chart axis labels and statistics evaluate to a contrast ratio >= 4.5:1 against the light background.
- `T3-INT-11`: **Reduced Motion Preference + Page Transitions**: Enabling `reducedMotion` in settings disables `BlazeTransitionOverlay` animations, performing instant page changes.
- `T3-INT-12`: **Account Popover + Mobile Screen Edge**: Opening the account popover at viewport boundary (320px) clamps popover position so that horizontal bounds remain strictly within `[0, 320px]`.

---

### 4.4 Tier 4: Real-World Scenarios (6 End-to-End Workflows)

- `T4-SCEN-01`: **Complete Voter Journey**:
  1. Voter enters landing page on 375px mobile viewport.
  2. Inspects current active voting round banner.
  3. Switches to VotePage via mobile navigation.
  4. Scrolls down through candidate pitch cards.
  5. Uses tap-to-rank chips to assign Candidate A (1st), Candidate B (2nd), and Candidate C (3rd).
  6. Reorders slot 2 and slot 3 using the Down chevron on slot 2.
  7. Validates candidate uniqueness and consensus compliance via `@platform/internal-logic`.
  8. Clicks 44px Cast Vote button.
  9. Observes success confirmation message and level-up audio trigger.

- `T4-SCEN-02`: **Pitch Creator Intake Lifecycle**:
  1. User taps "Submit Pitch" button in navbar on mobile.
  2. `CreatePitchModal` opens as a bottom-anchored sheet with drag pill on <768px.
  3. User enters title "The Nether Outpost" and a 450-character scene description.
  4. Character counter dynamically updates from `0 / 1500` to `450 / 1500`.
  5. User attaches an image; compression utility creates WebP preview.
  6. User submits form; mutation posts payload; modal dismisses; candidate appears in candidate pool.

- `T4-SCEN-03`: **Public Leaderboard & Consensus Conservation Audit**:
  1. Voter navigates to `PublicLeaderboard` view on 320px mobile viewport.
  2. Podium reorders to mobile stack: Gold (1st) renders first, followed by Silver (2nd) and Bronze (3rd).
  3. Standings table renders within `.table-wrap`, allowing thumb-scrolling across score columns without document overflow.
  4. Consensus equation verified: `totalPointsAwarded === 6 * totalBallots` and `isConserved === true`.

- `T4-SCEN-04`: **Adversarial Edge-Case Ballot Handling & Recovery**:
  1. Voter attempts to submit a ballot with duplicate candidates (Candidate A in slot 1 and slot 2).
  2. Validation engine rejects submission with anti-stacking error message.
  3. Voter taps 44×44px clear button on slot 2.
  4. Voter selects distinct Candidate D via tap chip.
  5. Ballot is resubmitted; passes validation; points are credited.

- `T4-SCEN-05`: **DevWorkbench Staff Moderation Workflow**:
  1. Moderator opens `DevWorkbench` on desktop view.
  2. 980px and 1140px telemetry tables render within `.table-wrap`.
  3. Theme is switched to light mode; telemetry text adapts to `var(--text-main)`.
  4. Moderator reviews moments and covariance matrices, triggering moderation actions via 44px buttons.

- `T4-SCEN-06`: **Multi-Device Viewport Audit**:
  1. Test runner sweeps canonical viewports: 320px, 375px, 390px, 414px, 768px, 1024px, 1280px.
  2. Asserts 0px horizontal scroll on all viewports <=768px.
  3. Asserts mobile navigation active on <=767px and desktop sidebar rail active on >=1024px.
  4. Asserts full visual fidelity and charts retained on >=1024px.

---

## 5. Test Runner Specification

### 5.1 Invocation Syntax
The test suite is invoked via standard Node.js without requiring global test runners:
```bash
# Execute entire test suite (Tiers 1-4)
node tests/runner.mjs

# Execute via npm script alias
npm test
```

### 5.2 Command-Line Arguments
| Argument | Type | Default | Description |
|:---------|:----:|:-------:|:------------|
| `--tier=<1\|2\|3\|4\|all>` | string | `all` | Filter execution to a specific coverage tier or all tiers. |
| `--verbose` | boolean | `false` | Enable detailed test diagnostics, duration, and assertion traces. |
| `--filter=<pattern>` | string | `""` | Regular expression pattern to filter test titles. |

### 5.3 Exit Codes
- `0`: All executed tests passed successfully.
- `1`: One or more tests failed, or runner encountered an uncaught runtime error.

### 5.4 Reporter Output Format
The runner outputs clean, structured ANSI-colored text formatted by tier:

```text
================================================================================
  VOTE-UI E2E TEST RUNNER — HARNESS v1.0.0
================================================================================
Node: v26.7.0 | Mode: Opaque-Box E2E | Target: vote-ui

================================================================================
  TIER 1: FEATURE COVERAGE (HAPPY PATHS)
================================================================================
  ✔ [T1-RESP-01] Mobile media query max-width 767px defined in styles.css (3ms)
  ...
  Tier 1 Subtotal: 60/60 passed (100%), 0 failed, 612ms

================================================================================
  TIER 2: BOUNDARY & CORNER CASES
================================================================================
  ✔ [T2-RESP-01] Viewport at 320px produces 0px horizontal document overflow (5ms)
  ...
  Tier 2 Subtotal: 60/60 passed (100%), 0 failed, 584ms

================================================================================
  TIER 3: CROSS-FEATURE INTERACTIONS (PAIRWISE)
================================================================================
  ✔ [T3-INT-01] Mobile Nav + Bottom Sheet Modal state dismissal (4ms)
  ...
  Tier 3 Subtotal: 12/12 passed (100%), 0 failed, 88ms

================================================================================
  TIER 4: REAL-WORLD SCENARIOS (WORKFLOWS)
================================================================================
  ✔ [T4-SCEN-01] Complete Voter Journey (14ms)
  ...
  Tier 4 Subtotal: 6/6 passed (100%), 0 failed, 64ms

================================================================================
  TEST SUITE EXECUTION SUMMARY
================================================================================
┌────────────────────────────────────────┬───────┬────────┬────────┬──────────┐
│ Coverage Tier                          │ Total │ Passed │ Failed │ Duration │
├────────────────────────────────────────┼───────┼────────┼────────┼──────────┤
│ Tier 1: Feature Coverage               │    60 │     60 │      0 │    612ms │
│ Tier 2: Boundary & Corner Cases        │    60 │     60 │      0 │    584ms │
│ Tier 3: Cross-Feature Interactions     │    12 │     12 │      0 │     88ms │
│ Tier 4: Real-World Scenarios           │     6 │      6 │      0 │     64ms │
├────────────────────────────────────────┼───────┼────────┼────────┼──────────┤
│ Total E2E Suite                        │   138 │    138 │      0 │   1348ms │
└────────────────────────────────────────┴───────┴────────┴────────┴──────────┘
Status: ALL TESTS PASSED (Exit Code: 0)
```

---

## 6. Directory Structure & Layout

The E2E test infrastructure resides in `tests/`:

```
tests/
├── runner.mjs                # CLI runner entrypoint (args parsing, tier dispatch, summary reporter)
├── harness.mjs               # Shared assertion utilities, CSS parser, simulated viewport helpers
├── tier1/                    # Tier 1: Feature Coverage tests (60 tests)
├── tier2/                    # Tier 2: Boundary & Corner Case tests (60 tests)
├── tier3/                    # Tier 3: Cross-Feature Interactions (12 tests)
└── tier4/                    # Tier 4: Real-World Scenarios (6 workflows)
```

---

## 7. Coverage Thresholds & Quality Gates

| Quality Gate | Metric / Target | Enforcement Mechanism |
|:-------------|:---------------:|:----------------------|
| **Total Test Count** | Exactly 138 tests (60 T1 + 60 T2 + 12 T3 + 6 T4) | `tests/runner.mjs` threshold check |
| **Pass Rate** | 100% (0 failed tests allowed) | Exit code 0 vs 1 |
| **Build Integrity** | 0 TypeScript errors (`tsc --noEmit`), 0 Vite build errors | `npm run typecheck && npm run build` |
| **Horizontal Overflow** | 0px document overflow on [320px, 375px, 414px, 768px] | CSS AST & DOM width checks |
| **Touch Target Size** | >= 44px width & >= 44px height on all touch interactive elements | CSS rule analysis on buttons, chips, links |
| **Mathematical Consensus** | Total Points == 6 * Total Ballots (0 variance) | `@platform/internal-logic` verification |

---
*End of Embedded TEST_INFRA.md Specification*
```

---

## 5. Caveats

1. **Static and Simulated Viewport Analysis**:
   - The test suite uses static AST, CSS rule parsing, and simulated layout engines rather than full Chromium render passes. This guarantees sub-second execution without headless browser binaries or GPU dependencies, but means pixel-perfect font kerning or hardware-accelerated transforms are verified via CSS property conformance rather than visual raster diffing.
2. **Milestone E2E-M3 Adversarial Hardening (Tier 5)**:
   - Tier 5 (Adversarial Coverage Hardening via Challengers) is slated for Milestone E2E-M3 per `PROJECT.md` line 58 and `SCOPE.md` line 34. This specification details Tiers 1–4, while providing the foundation and invariant gates for Tier 5.
3. **No Implementation Code Modified**:
   - In accordance with the Specification Miner archetype, no application files or test implementations were created or modified during this turn. Only `TEST_INFRA.md` and workspace metadata were written.

---

## 6. Conclusion

1. The comprehensive specification for `TEST_INFRA.md` has been created at `/home/yierke/Documents/vote-ui/TEST_INFRA.md`.
2. All 26 features from `PROJECT.md` and user requirements R1–R3 from `ORIGINAL_REQUEST.md` have been systematically mapped into 12 core feature groups and across 4 test tiers.
3. Exact coverage metrics are mathematically established:
   - Tier 1: 60 tests (12 groups × 5 happy paths)
   - Tier 2: 60 tests (12 groups × 5 boundary cases)
   - Tier 3: 12 tests (cross-feature pairwise combinations)
   - Tier 4: 6 tests (end-to-end workflows)
   - Total Suite: **138 tests** with a 100% passing threshold and zero-error build guarantee.
4. The test runner syntax (`node tests/runner.mjs`), CLI arguments (`--tier`, `--verbose`, `--filter`), exit codes (`0`/`1`), and reporter format are fully specified.
5. The E2E Testing track is completely equipped to proceed with test runner implementation (`explorer_m1_1`), verification pattern construction (`explorer_m1_2`), and full test suite authoring in Milestone E2E-M2.

---

## 7. Verification Method

To independently verify this deliverable:

1. **Verify `TEST_INFRA.md` File Existence & Completeness**:
   ```bash
   head -n 30 /home/yierke/Documents/vote-ui/TEST_INFRA.md
   wc -l /home/yierke/Documents/vote-ui/TEST_INFRA.md
   ```
   *Expected*: File exists with ~400+ lines detailing all 4 tiers, 12 feature groups, and 138 test cases.

2. **Verify Node.js Version & ESM Support**:
   ```bash
   node -v
   ```
   *Expected*: `v26.7.0` (native ESM and built-in test runner support).

3. **Verify `@platform/internal-logic` Integration**:
   ```bash
   node -e "import('@platform/internal-logic').then(m => console.log('Points per ballot:', m.POINTS_PER_BALLOT))"
   ```
   *Expected*: Prints `Points per ballot: 6`.

4. **Verify TypeScript Compatibility**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: Completes without syntax crashes.
