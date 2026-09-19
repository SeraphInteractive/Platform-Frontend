# Worker Dispatch: Milestone 1 (Persistent Mobile Navigation & Contextual Header)

## Exclusive File Write Ownership
- `src/components/Navbar.tsx`
- `src/App.tsx`
- `src/components/SettingsDropdown.tsx`
- `src/styles.css` (Navigation, dock, and header sections)

## Authoritative Inputs
- Read `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md` (specifically `## Follow-up — 2026-09-19T14:59:02Z` R1 & R2).
- Read `/home/yierke/Documents/vote-ui/PROJECT.md`.
- Read `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_1/report.md` for the exact JSX blueprints and CSS specifications.

## Objectives
1. **Persistent Mobile Bottom Navigation Dock (< 768px)**:
   - Render `<nav className="mobile-bottom-dock mobile-nav-bar mobile-only">` across all 11 routes.
   - 5 primary items: `Home` (`landing`), `Vote` (`ballot`), `Standings` (`leaderboard`), `GrabBox` (`grabbox`), `More` (toggles `isMobileDrawerOpen`).
   - Active state classes (`.active`) and `.mobile-dock-active-dot`.
   - Each item provides `>= 44×44px` touch area (`.mobile-dock-item.mobile-nav-item`).
2. **Slide-over / Bottom-sheet More Drawer**:
   - Accessible drawer for secondary routes: `progress`, `docs`, `settings`, `diagnostics` (staff gated), `privacy`, `terms`, `guidelines`.
   - Action button trigger for "Submit New Pitch".
   - Clean dismissal: backdrop overlay tap, close button, and route navigation resets body scroll.
3. **Contextual Mobile Header (52–56px, R2)**:
   - Sticky header with `calc(54px + env(safe-area-inset-top, 0px))` height and frosted glass backdrop.
   - Left: Geometric brand glyph button (`.brand-logo-mark.mobile-logo-btn`) navigating to `landing` + dynamic page title (`.mobile-header-title`) via `getContextualHeaderTitle(activeTab)`.
   - Right: Theme toggle button (`.icon-btn.mobile-icon-btn`) + Discord avatar / Sign In button with account popover (`SettingsDropdown`).
4. **Fix Subpage Trap Bug**:
   - Remove `{isHomePage && ...}` restriction around `.mobile-nav-header`. Render header and bottom dock unconditionally across all 11 routes on mobile viewports `< 768px`.
5. **Content Safe-Area Padding**:
   - Ensure `.dashboard-container` has bottom padding of `calc(72px + env(safe-area-inset-bottom, 16px))` on mobile so fixed bottom dock never obscures content or action buttons.

## Verification Requirements
- Execute `npm test` or `node tests/runner.mjs --filter="Navigation"` and `node tests/runner.mjs --filter="Touch"`.
- Execute `npm run typecheck`.
- Document execution commands and output in `handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-19T15:26:15Z
You are Worker 1 implementing Milestone 1: Persistent Mobile Navigation System (R1) and Contextual Mobile Header (R2).
Your working directory is: /home/yierke/Documents/vote-ui/.agents/worker_m1_survey2

MANDATORY: Read /home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md (specifically ## Follow-up — 2026-09-19T14:59:02Z).
Read your dispatch at /home/yierke/Documents/vote-ui/.agents/worker_m1_survey2/DISPATCH.md.
Read the architectural and CSS blueprints at /home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_1/report.md.
Read /home/yierke/Documents/vote-ui/PROJECT.md.

EXCLUSIVE FILE WRITE OWNERSHIP:
- src/components/Navbar.tsx
- src/App.tsx
- src/components/SettingsDropdown.tsx
- src/styles.css (navigation, bottom dock, and header rules)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement all Milestone 1 requirements:
1. Persistent Mobile Bottom Navigation Dock (< 768px) with 5 items (Home, Vote, Standings, GrabBox, More) across all 11 routes.
2. Active state indicators, labels, icons, and >=44x44px touch targets.
3. Slide-over / bottom-sheet More Drawer with secondary routes and quick actions.
4. Contextual Mobile Header (54px sticky, geometric glyph, contextual title per route, theme toggle, Discord avatar/popover).
5. Remove the {isHomePage && ...} trap so mobile navigation is active on ALL 11 routes.
6. Safe-area bottom padding to prevent dock occlusion.
7. Run npm test and npm run typecheck.
8. Write handoff.md in your working directory and message back with results when done.

