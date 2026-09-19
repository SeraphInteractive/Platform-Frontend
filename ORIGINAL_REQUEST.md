# Original User Request

## Initial Request — 2026-09-19T07:42:42Z

Refactor and optimize the platform web application at `vote-ui` (/home/yierke/Documents/vote-ui) into a modern, polished, and mobile-friendly responsive experience.

Working directory: /home/yierke/Documents/vote-ui
Integrity mode: demo

## Requirements

### R1. Adaptive Mobile Layout & Responsive Breakpoints
Implement clean mobile-first breakpoints and container queries across the application so that all core pages—including Navbar, VotePage (candidate cards & 3-tier ranked ballot selector), PublicLeaderboard, Pitch Submissions, GrabBox, Guidelines, Docs, and DevWorkbench—scale fluidly without horizontal scrollbars, clipped text, or squished UI elements on screens from 320px to 768px.

### R2. Touch Ergonomics & Mobile Interaction Patterns
Upgrade interactive elements to meet modern mobile touch standards:
- Ensure all clickable and tappable elements meet the minimum 44×44px touch target guidelines.
- Transform desktop-centered modals (e.g. `CreatePitchModal`, settings popups) into smooth mobile bottom sheets/drawers on small viewports.
- Optimize the 3-slot ranked ballot selection workflow for single-handed mobile usage with clear tap-to-select and quick-reorder controls.

### R3. Desktop Preservation & Build Integrity
Ensure desktop and tablet form factors retain their full fidelity, charts, and information density without regressions. Keep all existing features, sound effects, and API bindings intact, ensuring `npm run typecheck` and `npm run build` succeed with zero errors.

## Acceptance Criteria

### Mobile Responsiveness
- [ ] No horizontal scrolling on viewports between 320px and 768px across all application routes.
- [ ] Mobile navigation supports an accessible hamburger menu or bottom bar for seamless route switching.
- [ ] Candidate pitch cards and ranked ballot slots stack gracefully on phone screens with legible typography and thumb-friendly buttons.
- [ ] `CreatePitchModal` displays as a responsive bottom sheet with touch-friendly form controls, character counts, and upload triggers.

### Quality & Regression Testing
- [ ] `npm run build` and TypeScript typechecking complete with 0 errors.
- [ ] Both mobile (< 768px) and desktop (>= 1024px) layouts render cleanly without visual overlap or broken layouts.

## Follow-up — 2026-09-19T14:59:02Z

Redesign the platform's mobile UI across all subpages with a persistent app-style bottom navigation tab bar, modern contextual top header, robust touch-friendly layouts for all views, strict role permissions for moderators/admins in Dev Workbench, and an interactive real-time Dev Server Mobile Viewport simulator.

Working directory: /home/yierke/Documents/vote-ui
Integrity mode: development

## Requirements

### R1. Persistent Mobile Navigation System (< 768px)
- Implement a persistent **App-Style Bottom Navigation Dock** with frosted glass backdrop across all subpages on mobile (< 768px).
- Provide immediate 1-tap thumb navigation to primary routes:
  - `Home` (`landing`)
  - `Vote & Rank` (`ballot`)
  - `Standings` (`leaderboard`)
  - `GrabBox` (`grab-box`)
  - `More` (Trigger for slide-over drawer / sheet)
- Provide a slide-over/bottom-sheet **More Drawer** exposing secondary routes and tools (`Progress`, `Docs`, `Settings`, `Dev Workbench`, `Privacy`, `Terms`, `Guidelines`, and quick action triggers).
- Guarantee that a user on mobile can navigate between any pair of routes at any time without getting stuck or losing access to navigation controls.

### R2. Mobile Header & Contextual Branding Overhaul
- Replace the legacy 'STAIRWAY' text banner with a modern **Contextual Mobile Header**:
  - Left: Clean stylized geometric brand glyph + current page title (e.g. "Voting Round", "Leaderboard", "GrabBox Dispatch", "Documentation", "Platform Settings").
  - Right: Quick actions including theme toggle (light/dark) and user Discord avatar / Sign In button with quick account overview popover.
- Keep the header sticky and lightweight (52px–56px height) with safe-area inset padding.

### R3. Comprehensive Mobile View & Layout Density Overhaul
- Fix responsive layout issues and eliminate document overflow across all subpages on viewports 320px to 428px:
  - **VotePage**: Candidate roller, tap-to-rank action chips, filled ballot slots with Up/Down reorder controls, and a persistent or easily reachable Cast Ballot submit button.
  - **PublicLeaderboard**: Stacked mobile podium (Gold 1st place on top, followed by Silver 2nd and Bronze 3rd), fluid score cards, and horizontally scrollable standings table.
  - **DocsPage**: Clean Wikipedia layout with responsive infobox wrapping, collapsible TOC, and zero horizontal document blowout.
  - **ProgressPage & GrabBoxPage**: Adaptive milestone track, responsive shot cards, and clean filter chips.
  - **SettingsPage & DevWorkbench**: Fluid tab chips and responsive table wraps.

### R4. Touch Ergonomics & Dialog Bottom Sheet Unification
- Convert all dialog modals (`CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, `CandidateDetailModal`) on mobile (< 768px) into native-feeling **Bottom Sheets**:
  - Drag handle / pill indicator at top (`.modal-drag-pill`).
  - Anchored to bottom of viewport (`bottom: 0`, rounded top corners `20px 20px 0 0`).
  - Max height 85vh with internal vertical scrolling and backdrop click dismiss.
- Enforce minimum interactive touch target dimensions of >= 44x44px across all buttons, chips, reorder chevrons, close icons, and navigation items.

### R5. Interactive Real-Time Dev Server Viewport Simulator
- Build a toggleable **Dev Viewport Simulator Toolbar** accessible in development mode (or via Dev Workbench / floating dev dock):
  - Presets for popular device viewports:
    - **iPhone SE / Small**: 375 × 667
    - **iPhone 15 / Standard**: 393 × 852
    - **Pixel 7 / Tall**: 412 × 915
    - **iPad Mini / Tablet**: 768 × 1024
    - **Desktop Full**: 100% viewport width
  - Controls: Zoom scale slider (50% to 125%), Rotate orientation (portrait / landscape), and close/reset.
  - Render the active application inside a photorealistic framed device container with live real-time interaction, routing sync, and touch simulation.

### R6. Staff & Role-Based Permissions in Dev Workbench
- Gate the Dev Workbench for staff roles (`admin`, `moderator`, `supervisor`).
- **Moderator Access**: Content moderation (Approve / Flag as AI / Reject), Moments statistical variance analysis, Telemetry anomaly review, and Network health monitoring.
- **Admin / Supervisor Elevated Access**: Destructive lifecycle actions (Permanent Proposal Deletion, Round Deletion) and the **Roles & Staff Management** tab are strictly gated to `admin` / `supervisor` with clear visual feedback and role badges so unauthorized actions are never exposed to lower tiers.

## Acceptance Criteria

### Navigation & Routing
- [ ] Users on mobile viewports (< 768px) can navigate between all routes seamlessly using the bottom dock and 'More' drawer without ever being trapped.
- [ ] Mobile header displays active page context, stylized geometric brand glyph, theme toggle, and account overview on all views.
- [ ] Active route indicator highlights correctly on both bottom dock and subpage drawer.

### Mobile UI & Layout Invariants
- [ ] 0px horizontal document overflow on 320px, 375px, 390px, 414px, and 767px viewports across all views.
- [ ] All modals adopt bottom-sheet styling on < 768px with drag pill, internal scroll, and backdrop dismiss.
- [ ] All interactive touch targets (rank chips, clear slot buttons, reorder chevrons, action buttons) provide >= 44x44px tappable bounding areas with >= 8px adjacent separation.
- [ ] PublicLeaderboard podium stacks with 1st place on top on mobile viewports.

### Dev Viewport Simulator
- [ ] Dev Viewport Toolbar toggles smoothly in dev environment.
- [ ] Switching between device presets dynamically resizes the frame and updates dimensions in real-time.
- [ ] Live application remains fully interactive within the simulated viewport frame.
- [ ] Orientation rotation swaps width and height cleanly without layout breakage.

### Quality & Build Verification
- [ ] `npm run typecheck` passes with 0 TypeScript errors.
- [ ] `npm run build` generates production bundle cleanly with 0 errors.
