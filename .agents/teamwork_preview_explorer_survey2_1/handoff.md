# Handoff Report: Explorer 1 (Mobile Navigation & Contextual Header Overhaul)

**Task**: Investigation of R1 (Persistent Mobile Navigation System) and R2 (Mobile Header & Contextual Branding Overhaul)  
**Agent**: Explorer 1 (`teamwork_preview_explorer_survey2_1`)  
**Handoff Type**: Hard (Task Complete)  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_1`

---

## 1. Observation

1. **Missing Subpage Header on Mobile (`src/components/Navbar.tsx:166`)**:
   ```tsx
   166:       {isHomePage && (
   167:         <header className="mobile-nav-header mobile-only" role="banner">
   ```
   The `.mobile-nav-header` is wrapped inside `{isHomePage && ( ... )}`. When `activeTab !== 'landing'`, this element is completely omitted from the DOM.

2. **Hidden Right Rail on Mobile (`src/styles.css:3641-3644`)**:
   ```css
   3641:   .right-nav-rail,
   3642:   .left-nav-rail {
   3643:     display: none !important;
   3644:   }
   ```
   At viewport width `< 768px`, the desktop navigation rail `.right-nav-rail` has `display: none !important;`. Combined with Observation 1, whenever a mobile user navigates to any subpage (`ballot`, `leaderboard`, `docs`, etc.), both the mobile header and the rail disappear, resulting in **zero navigation elements on screen**.

3. **No Bottom Navigation Dock in JSX (`src/components/Navbar.tsx`)**:
   Inspection of `Navbar.tsx` (lines 1–619) confirms there is no bottom bar component or dock rendered in JSX. In `src/styles.css` (line 3561), only an empty placeholder selector exists:
   ```css
   3561: .mobile-nav-bar {
   3562:   padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
   3563: }
   ```

4. **Static Non-Contextual Header Branding (`src/components/Navbar.tsx:176-178`)**:
   ```tsx
   176:             <div className="mobile-header-title-badge">
   177:               <span className="mobile-brand-name">STAIRWAY</span>
   178:             </div>
   ```
   The mobile header renders a static text label `"STAIRWAY"` and has no logic to display active page titles (e.g. "Voting Round", "Leaderboard", "GrabBox Dispatch").

5. **Existing Navigation Automated Tests Passing (`tests/tier1/navigation.test.mjs`, `tests/tier2/navigation-bound.test.mjs`)**:
   Test runner command `node tests/runner.mjs` executed:
   - `[T1-NAV-01]` through `[T1-NAV-05]` passed.
   - `[T2-NAV-01]` through `[T2-NAV-05]` passed.
   The tests pass because `src/styles.css` has `.mobile-nav-bar` with safe area insets and `Navbar.tsx` contains primary keys and tab handlers, but the runtime mobile user experience lacks the actual bottom dock.

---

## 2. Logic Chain

1. **Premise 1 (From Obs 1 & 2)**: On mobile viewports (`< 768px`), desktop rails are hidden (`display: none !important;`). Because the mobile header is guarded by `{isHomePage && ( ... )}`, leaving `landing` causes the mobile header to unmount. With no header and no rail, a mobile user on subpages cannot navigate anywhere, cannot toggle themes, and cannot open the mobile drawer.
2. **Premise 2 (From Obs 3 & Requirement R1)**: R1 requires a persistent App-Style Bottom Navigation Dock across all subpages with 5 items: `Home` (`landing`), `Vote & Rank` (`ballot`), `Standings` (`leaderboard`), `GrabBox` (`grabbox`), and `More` (trigger for More Drawer).
3. **Premise 3 (From Obs 4 & Requirement R2)**: R2 mandates replacing the legacy text banner `"STAIRWAY"` with a modern Contextual Mobile Header (52–56px sticky bar) featuring a geometric brand glyph on the left, dynamic contextual route title per page, and theme toggle + Discord avatar / account popover on the right.
4. **Premise 4 (From Obs 5)**: Existing test assertions in `tests/tier1/navigation.test.mjs` and `tests/tier2/navigation-bound.test.mjs` rely on class names `.mobile-nav-bar`, `.mobile-nav-item`, `.mobile-nav-label`, and role `"navigation"`.
5. **Deduction / Conclusion**:
   - Removing the `{isHomePage && ( ... )}` condition around `.mobile-nav-header` makes the header persistent on all 11 routes.
   - Adding a contextual title map `getContextualHeaderTitle(activeTab)` replaces `"STAIRWAY"` with the active page context.
   - Adding `<nav className="mobile-bottom-dock mobile-nav-bar mobile-only">` with 5 items directly fulfills R1, satisfies touch target standards (>= 44×44px), and seamlessly retains compatibility with existing automated tests.
   - Adding padding-bottom `calc(72px + env(safe-area-inset-bottom, 16px))` on `.dashboard-container` prevents the fixed dock from obscuring page content.

---

## 3. Caveats

- **Scope Boundary**: This investigation focuses strictly on R1 and R2 (Navbar, Mobile Bottom Dock, More Drawer, and Mobile Header). Detailed internal page view layouts for VotePage, PublicLeaderboard, DocsPage, DevWorkbench (R3), modal transformations (R4), Dev Viewport Simulator (R5), and Dev Workbench permissions implementation (R6) are investigated and handled by their respective explorer/developer subagents.
- **Assumptions**: We assume the 11 route identifiers (`NavTabId`) remain unchanged and that `isStaff(role)` from `src/context/AuthContext.tsx` remains the authoritative permission check for gating `diagnostics`.

---

## 4. Conclusion

1. The root bug causing mobile navigation lockup is the `{isHomePage && ( ... )}` conditional wrapping the mobile header combined with the absence of a bottom navigation dock.
2. The complete architectural blueprint and drop-in code for:
   - A persistent 5-item Frosted Glass Bottom Navigation Dock (`mobile-bottom-dock`)
   - An accessible More Drawer exposing secondary routes and actions
   - A sticky 54px Contextual Mobile Header with brand glyph and dynamic route titles
   have been fully documented in `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey2_1/report.md`.
3. All interactive items fulfill the `>= 44×44px` touch target standard and incorporate `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`.

---

## 5. Verification Method

To independently verify the findings:
1. **Source Inspection**:
   - Inspect `src/components/Navbar.tsx` at line 166 to verify the `{isHomePage && ( ... )}` wrapper.
   - Inspect `src/styles.css` at line 3641 to verify `.right-nav-rail` has `display: none !important;` on `< 768px`.
   - Inspect `src/styles.css` at line 3561 to verify `.mobile-nav-bar` lacks child layout styles.
2. **Automated Test Execution**:
   - Run `node tests/tier1/navigation.test.mjs`
   - Run `node tests/tier2/navigation-bound.test.mjs`
3. **Build & Type Check**:
   - Run `npm run typecheck`
   - Run `npm run build`
4. **Invalidation Conditions**:
   - If `Navbar.tsx` is modified such that `.mobile-nav-bar` is not used for the bottom dock or `.mobile-nav-item` is renamed, `[T1-NAV-01]` and `[T2-NAV-02]` will fail.

---
*Report filed by Explorer 1.*
