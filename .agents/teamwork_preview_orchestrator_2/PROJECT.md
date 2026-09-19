# Project: vote-ui Modernization & Responsive Mobile Redesign (R1–R6)

## Architecture
- **Framework**: React 18.3.1 (SPA), TypeScript 5.7.3, Vite 6.2.0, `@tanstack/react-query` 5.67.1
- **Domain Logic**: `@platform/internal-logic` (path alias to `../vote-internals/src/index.ts`)
- **Styling Architecture**: Monolithic vanilla stylesheet `src/styles.css` with CSS custom properties (`:root`, `[data-theme="light"]`, `[data-theme="dark"]`). Zero Tailwind or PostCSS runtime.
- **Routing**: Tab-state driven SPA via `activeTab` in `src/App.tsx` (11 views: `landing`, `ballot`, `leaderboard`, `docs`, `grabbox`, `diagnostics`, `settings`, `progress`, `privacy`, `terms`, `guidelines`).
- **Layout Architecture**:
  - `layout-homepage`: Top floating pill navbar on desktop.
  - `layout-with-sidebar`: 64px vertical right rail in row flexbox on desktop (>=768px/1024px); converts to responsive column layout with persistent mobile navigation on small viewports (<768px).
  - `mobile-nav-header`: 54px sticky contextual header on all views for viewports <768px.
  - `mobile-bottom-dock`: 56px fixed frosted-glass bottom navigation dock on all views for viewports <768px.
  - `DevViewportSimulator`: Isolated same-origin iframe (`?sim_frame=1`) with photorealistic chassis, preset switcher, zoom slider, and rotation controls.

## Code Layout
- `package.json`: NPM scripts (`test`, `typecheck`, `build`, `dev`).
- `src/App.tsx`: Root layout, routing state machine, lazy view loading, Dev Viewport Simulator host.
- `src/styles.css`: Global styles, theming variables, media queries, mobile dock, bottom sheets, layout density rules.
- `src/components/Navbar.tsx`: Desktop top navbar & vertical right rail; persistent mobile bottom dock, More Drawer, and contextual mobile header.
- `src/components/SettingsDropdown.tsx`: Account overview popover and quick theme toggles.
- `src/components/DevViewportSimulator.tsx`: Interactive real-time dev server viewport simulator toolbar and framed container.
- `src/components/CreatePitchModal.tsx`: Pitch creation dialog (desktop modal / mobile bottom sheet).
- `src/components/CreateRoundModal.tsx`: Round creation dialog.
- `src/components/CommandPalette.tsx`: Global shortcut command palette (`Cmd+K`).
- `src/views/VoterApp/VotePage.tsx`: Core candidate roller, inline tap-to-rank chips, ballot slots with Up/Down chevrons, reachable Cast Ballot button.
- `src/views/VoterApp/PublicLeaderboard.tsx`: 3D podium and mobile stacked podium (Gold on top), standings table with `.table-wrap`.
- `src/views/Docs/DocsPage.tsx`: Wikipedia-style documentation, collapsible TOC, `.docs-page-layout`, and `.table-wrap` tables.
- `src/views/Settings/SettingsPage.tsx`: User profile, appearance settings, `.settings-page-layout`, and `.settings-nav-tabs`.
- `src/views/Progress/ProgressPage.tsx`: 17-sub-stage milestone roadmap, update feed, and `.progress-timeline-track`.
- `src/views/GrabBox/GrabBoxPage.tsx`: Shot claiming and task dispatch view.
- `src/views/DevWorkbench/DevWorkbench.tsx`: Staff moderation console with strict RBAC gating for moderator vs admin/supervisor.
- `src/views/DevWorkbench/RolesManagementView.tsx`: Staff role assignment and directory.
- `src/views/Legal/*`: Privacy, terms, and guidelines documents.
- `tests/`: 4-tier E2E testing suite (138 tests) + Tier 5 adversarial tests.

## Feature Inventory
Every feature from user requirements (R1–R6) and the Survey Phase is cataloged below with assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Persistent Mobile Bottom Dock | 5-item frosted glass dock (`Home`, `Vote`, `Standings`, `GrabBox`, `More`) with active indicators on <768px | M1 | R1, Explorer 1 |
| 2 | Mobile More Drawer | Slide-over / bottom-sheet drawer exposing secondary routes, legal links, and quick pitch trigger without trap | M1 | R1, Explorer 1 |
| 3 | Contextual Mobile Header | 52-56px sticky header with geometric brand glyph, dynamic page title per route, theme toggle, and account overview | M1 | R2, Explorer 1 |
| 4 | Subpage Navigation Bug Fix | Remove `{isHomePage && ...}` lock on `.mobile-nav-header` so header and dock persist across all 11 routes | M1 | Explorer 1 |
| 5 | Mobile Safe-Area Content Padding | `calc(72px + env(safe-area-inset-bottom, 16px))` bottom padding on dashboard containers to prevent dock occlusion | M1 | Explorer 1 |
| 6 | 0px Horizontal Overflow (320-428px) | Zero horizontal document blowout on all routes between 320px and 428px | M2 | R3, Explorer 2 |
| 7 | VotePage Inline Tap-to-Rank Chips | Add `.tap-rank-chip` (`[1st]`, `[2nd]`, `[3rd]`) on candidate cards with >=44px target and 8px gap | M2 | R3, Explorer 2 |
| 8 | VotePage Slot Reorder Chevrons | Add Up/Down (▲/▼) `.slot-reorder-btn` chevrons on filled ballot slots for single-handed reordering | M2 | R3, Explorer 2 |
| 9 | VotePage Reachable Cast Button | Ensure Cast Ballot button matches `/Cast (Your )?Ballot|cast-ballot|cast-vote/i` and is reachable on mobile | M2 | R3, Explorer 2 |
| 10 | VotePage Audio Engine Triggers | Connect `sounds.playPop()`, `sounds.playReset()`, `sounds.playLevelUp()` to chip tap, slot clear, and ballot submit | M2 | R3, Explorer 2 |
| 11 | PublicLeaderboard Mobile Podium | Stack podium with Gold (1st place) on top using `.podium-place-1/2/3` order on <768px | M2 | R3, Explorer 2 |
| 12 | PublicLeaderboard Table Wrapping | Wrap standings table in `<div className="table-wrap">` with horizontal scrolling | M2 | R3, Explorer 2 |
| 13 | DocsPage Responsive Layout | Add `.docs-page-layout` (1fr on mobile), wrap all 4 specification tables in `<div className="table-wrap">` | M2 | R3, Explorer 2 |
| 14 | Secondary Pages Responsive Density | SettingsPage 1-col layout with `.settings-nav-tabs`; ProgressPage `.progress-timeline-track`; GrabBox card scaling | M2 | R3, Explorer 2 |
| 15 | Unified Dialog Bottom Sheets | Transform `CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, inspect modal into bottom sheets on <768px | M3 | R4, Explorer 2 |
| 16 | Bottom Sheet Drag Handle & Anchoring | `.modal-sheet-mobile` with `.modal-drag-pill`, `bottom: 0`, `20px 20px 0 0` radius, max-height 85vh, inner scroll | M3 | R4, Explorer 2 |
| 17 | Comprehensive 44×44px Touch Target Audit | Enforce >=44×44px targets on all buttons, clear buttons, chevrons, close icons, `.thought-bubble-trigger` (44px) | M3 | R4, Explorer 2 |
| 18 | Interactive Dev Viewport Simulator Toolbar | Build toolbar with 5 presets (iPhone SE, iPhone 15, Pixel 7, iPad Mini, Desktop Full) | M4 | R5, Explorer 3 |
| 19 | Viewport Simulator Controls | Zoom slider (50%–125%), rotate orientation (swaps W/H), dimensions readout, reset, and close | M4 | R5, Explorer 3 |
| 20 | Photorealistic Chassis & Isolated Frame | Same-origin iframe (`?sim_frame=1`) with Dynamic Island, punch-hole, status bar, home bar, and touch cursor | M4 | R5, Explorer 3 |
| 21 | Simulator Launch Triggers | Floating dev dock launcher in dev mode and launch button in Dev Workbench header | M4 | R5, Explorer 3 |
| 22 | Staff RBAC Gating in Dev Workbench | Gate DevWorkbench: Moderator (moderation, moments, telemetry, network) vs Admin/Supervisor (destructive lifecycle & roles) | M4 | R6, Explorer 3 |
| 23 | Destructive Lifecycle Action Gating | Delete Round and Delete Proposal buttons strictly hidden from moderators, accessible only to Admin/Supervisor | M4 | R6, Explorer 3 |
| 24 | Roles & Staff Management Gating | Roles tab strictly hidden from moderators; enable role assignment for both Admin and Supervisor in live DB | M4 | R6, Explorer 3 |
| 25 | Visual Role Clearance Badges | Color-coded role tier badges (`ADMINISTRATOR` red, `SUPERVISOR` engine/violet, `MODERATOR` warning/amber) | M4 | R6, Explorer 3 |
| 26 | Full E2E Test Suite 100% Pass | All 138 tests in `tests/runner.mjs` pass cleanly (0 failures) | M5 | Acceptance |
| 27 | Adversarial Coverage Hardening (Tier 5) | Challenger stress tests covering Dev Viewport Simulator, RBAC gating matrix, and mobile navigation edge cases | M5 | Protocol |
| 28 | Build & Typecheck Zero Error Guarantee | `npm run typecheck && npm run build` succeed with 0 errors | M5 | Acceptance |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Persistent Mobile Nav & Contextual Header | `src/components/Navbar.tsx`, `src/App.tsx`, `src/styles.css`: bottom dock (5 items), More drawer, contextual header (54px, glyph, title, theme, avatar), safe-area padding | none | DONE (Passed all gate criteria, 14/14 tests pass) |
| M2 | Mobile View & Layout Density Overhaul | `VotePage.tsx`, `PublicLeaderboard.tsx`, `DocsPage.tsx`, `ProgressPage.tsx`, `SettingsPage.tsx`, `styles.css`: 0px overflow 320-428px, tap chips, chevrons, podium order, table-wraps | M1 | PLANNED |
| M3 | Touch Ergonomics & Dialog Bottom Sheets | `CreatePitchModal.tsx`, `CreateRoundModal.tsx`, `CommandPalette.tsx`, `styles.css`: bottom sheets (<768px), drag pill, 85vh, 44x44px touch targets on all interactive elements | M1 | PLANNED |
| M4 | Dev Viewport Simulator & Dev Workbench RBAC | `DevViewportSimulator.tsx`, `DevWorkbench.tsx`, `RolesManagementView.tsx`, `AuthContext.tsx`, `App.tsx`: 5 presets, zoom, rotate, photorealistic chassis, iframe, RBAC gating | M1 | PLANNED |
| M5 | E2E Suite Pass & Adversarial Hardening | Verify 100% pass on 138-test suite (Tiers 1-4), Tier 5 Challenger adversarial hardening, `npm run typecheck && npm run build` 0 errors | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### Mobile Navigation ↔ Application Views
- Breakpoint boundary: `@media (max-width: 767px)` activates mobile layout; `@media (min-width: 768px)` activates desktop/tablet mode.
- Mobile Navigation Dock: `<nav className="mobile-bottom-dock mobile-nav-bar mobile-only">` with items `.mobile-dock-item.mobile-nav-item`.
- Active tab switching retains exact `handleTabChange(tab: NavTabId)` contract.
- More Drawer: toggled via `isMobileDrawerOpen`, manages secondary routes, resets `document.body.style.overflow = ''` upon route selection.
- Safe Area Padding: `.dashboard-container.container-sidebar, .dashboard-container.container-homepage` set `padding-bottom: calc(72px + env(safe-area-inset-bottom, 16px)) !important;`.

### Candidate Cards ↔ Ballot Slots (`VotePage.tsx`)
- Inline Tap Chips: `.tap-rank-chip` with screen reader labels, calling `onSelectRank(rank: 1 | 2 | 3, entryId: string)`.
- Slot Reorder Chevrons: `.slot-reorder-btn` calling `onReorderRank(sourceRank, targetRank)`.
- Clear Button: `.slot-clear-btn` calling `onClearSlot(rank)`.
- All touch targets declare `min-width: 44px; min-height: 44px;`.
- Cast button text contains `/Cast (Your )?Ballot|cast-ballot|cast-vote/i`.

### Dialog Modals & Bottom Sheets
- Desktop (`>=768px`): Floating centered dialog (`.modal-dialog-desktop`).
- Mobile (`<768px`): Native bottom sheet (`.modal-sheet-mobile`) with `.modal-drag-pill`, `bottom: 0`, `max-height: 85vh`, `border-radius: 20px 20px 0 0;`, `overflow-y: auto`.
- Close button: `.modal-close-btn` with `min-width: 44px; min-height: 44px;`.

### Dev Viewport Simulator ↔ Host Application
- Query Parameter Flag: `?sim_frame=1` passed to iframe src.
- Host check: `isInsideSimulatorIframe` disables simulator toolbar inside child frame to prevent recursion.
- Presets:
  - `iphone-se`: 375 × 667 px
  - `iphone-15`: 393 × 852 px
  - `pixel-7`: 412 × 915 px
  - `ipad-mini`: 768 × 1024 px
  - `desktop`: 100% width
- Transform: `scale(zoom / 100)` with `transform-origin: top center`.

### Dev Workbench RBAC Matrix
- `isStaff(user?.role)`: allows entry to Dev Workbench.
- `isElevatedStaff(user?.role)`: (`admin` or `supervisor*`) gates `handleDeleteRound`, `handleDeleteEntry`, and `Roles` management tab.
- Lower staff (`moderator`): can Approve, Flag as AI, Reject pitches; inspect moments, telemetry, and network; cannot delete rounds, proposals, or manage staff roles.
- Role Badges: `ADMINISTRATOR` (red), `SUPERVISOR` (violet/engine), `MODERATOR` (amber/warning).
