# Execution Plan — vote-ui Mobile Redesign (R1–R6)

## Objective
Implement and verify all 6 requirements from ORIGINAL_REQUEST.md follow-up:
1. R1: Persistent Mobile Navigation System (< 768px) with App-Style Bottom Dock (Home, Vote & Rank, Standings, GrabBox, More) + Slide-over More Drawer.
2. R2: Mobile Header & Contextual Branding Overhaul (geometric brand glyph + page title + theme toggle + Discord avatar / account popover, safe-area inset, 52-56px).
3. R3: Comprehensive Mobile View & Layout Density Overhaul (0px horizontal overflow on 320-428px for VotePage, PublicLeaderboard stacked podium, DocsPage, ProgressPage, GrabBoxPage, SettingsPage, DevWorkbench).
4. R4: Touch Ergonomics & Dialog Bottom Sheet Unification (>=44x44px touch targets, bottom sheet transformation with drag handle for CreatePitchModal, CreateRoundModal, CommandPalette, CandidateDetailModal).
5. R5: Interactive Real-Time Dev Server Viewport Simulator (device presets, zoom slider, rotation, live interactive frame).
6. R6: Staff & Role-Based Permissions in Dev Workbench (moderator vs admin/supervisor gating).

## Planned Milestones
- **Phase 0: Survey Phase**:
  - Dispatch 3 parallel Explorers:
    - Explorer 1: Navigation & Header (R1, R2, App.tsx, Navbar.tsx, styling, More drawer, safe-area insets).
    - Explorer 2: View Density & Touch Targets (R3, R4, VotePage, PublicLeaderboard podium, DocsPage, ProgressPage, GrabBoxPage, SettingsPage, Modals).
    - Explorer 3: Dev Viewport Simulator & Dev Workbench RBAC (R5, R6, DevWorkbench.tsx, viewport toolbar frame, staff roles).
  - Synthesize reports into updated `PROJECT.md` Feature Inventory.

- **Milestone 1 (M1): Navigation & Contextual Header (R1, R2)**
  - App-Style Bottom Navigation Dock with frosted glass backdrop.
  - 1-tap thumb navigation for Home (`landing`), Vote & Rank (`ballot`), Standings (`leaderboard`), GrabBox (`grab-box`), More.
  - Slide-over / bottom-sheet More Drawer with secondary routes (`progress`, `docs`, `settings`, `diagnostics`, `privacy`, `terms`, `guidelines`).
  - Contextual Mobile Header (52-56px, geometric brand glyph, active page title, theme toggle, Discord avatar/popover).
  - Loop: Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate.

- **Milestone 2 (M2): Mobile View & Layout Density Overhaul (R3)**
  - Zero horizontal overflow (320px–428px) across all routes.
  - VotePage: Candidate roller, inline tap-to-rank chips, ballot slots with reorder chevrons, reachable Cast Ballot button.
  - PublicLeaderboard: Stacked mobile podium (Gold 1st on top, Silver 2nd, Bronze 3rd), fluid score cards, `.table-wrap` table.
  - DocsPage: Wikipedia infobox wrapping, collapsible TOC, zero overflow.
  - ProgressPage, GrabBoxPage, SettingsPage, DevWorkbench: responsive layouts, chip wrapping, table wrapping.
  - Loop: Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate.

- **Milestone 3 (M3): Touch Ergonomics & Dialog Bottom Sheet Unification (R4)**
  - Convert `CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, and `CandidateDetailModal` to bottom sheets on <768px.
  - `.modal-drag-pill` drag handle, bottom anchor (`bottom: 0`), top rounded corners (`20px 20px 0 0`), max-height 85vh with inner scroll.
  - Enforce >=44x44px touch targets on all interactive elements with >=8px separation.
  - Loop: Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate.

- **Milestone 4 (M4): Interactive Dev Viewport Simulator & Dev Workbench RBAC (R5, R6)**
  - Dev Viewport Simulator Toolbar with presets (iPhone SE 375x667, iPhone 15 393x852, Pixel 7 412x915, iPad Mini 768x1024, Desktop Full 100%), zoom slider (50%-125%), rotation toggle, live interactive frame.
  - Staff & Role-Based Permissions in Dev Workbench: moderator vs admin/supervisor gating, role badges, feedback.
  - Loop: Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate.

- **Milestone 5 (M5): E2E Testing Track Verification & Adversarial Hardening**
  - Update and execute full 4-tier E2E test suite.
  - Pass 100% of test suite.
  - Adversarial coverage hardening (Tier 5) with Challengers.
  - Verify `npm run typecheck` and `npm run build` succeed with 0 errors.
