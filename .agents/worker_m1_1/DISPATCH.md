# Dispatch: Worker (Milestone 1 — Tooling, Responsive Breakpoints & Navigation)

## Mission
Implement the complete set of Milestone 1 changes for `vote-ui` based on the synthesized Explorer findings.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs to Read
- `/home/yierke/Documents/vote-ui/.agents/ORIGINAL_REQUEST.md` (MANDATORY)
- `/home/yierke/Documents/vote-ui/PROJECT.md`
- `/home/yierke/Documents/vote-ui/.agents/sub_orch_milestone_1/SCOPE.md`
- Explorer 1 Report: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_1/handoff.md`
- Explorer 2 Report: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_2/handoff.md`
- Explorer 3 Report: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_3/handoff.md`
- Modern Web Guidance skill: `/home/yierke/.gemini/config/plugins/modern-web-guidance-plugin/skills/modern-web-guidance/SKILL.md`

## Files Owned Exclusively
- `package.json`
- `src/styles.css`
- `src/App.tsx`
- `src/components/Navbar.tsx`
- `src/components/SettingsDropdown.tsx`

## Detailed Implementation Tasks
1. **Tooling (`package.json`)**:
   - Add `"typecheck": "tsc --noEmit"` to `scripts`.
   - Verify `npm run typecheck` passes with zero errors.

2. **Semantic Breakpoints & Reset (`src/styles.css`)**:
   - Normalize `#root` and `.app-root-layout` from `width: 100vw;` to `width: 100%; max-width: 100%;` to eliminate horizontal scrollbars caused by vertical scrollbars on Windows/Linux.
   - Establish semantic media query blocks at the bottom of `src/styles.css`:
     - Mobile: `@media (max-width: 767px)`
     - Tablet: `@media (min-width: 768px) and (max-width: 1023px)`
     - Desktop: `@media (min-width: 1024px)`
   - Under `@media (max-width: 767px)`:
     - Collapse `.right-nav-rail` (`display: none !important;`) and hide `.top-navbar-fixed-container .nav-menu`.
     - Set `.app-root-layout.layout-with-sidebar` to `flex-direction: column; padding: 0; gap: 0; height: 100vh; height: 100dvh; overflow-y: auto; overflow-x: hidden;`.
     - Set `.dashboard-container.container-sidebar` to `height: auto; min-height: 100%; padding: 8px 12px 72px 12px; overflow: visible;`.
     - Unlock `.page-view-wrapper.page-non-scroll` on viewports `< 1024px` to have `overflow-y: auto; -webkit-overflow-scrolling: touch;`. Desktop `>= 1024px` remains non-scroll (`overflow: hidden; height: 100%;`).

3. **Mobile Navigation (`src/components/Navbar.tsx` & `src/styles.css`)**:
   - Implement an accessible mobile navigation pattern:
     - A mobile top bar (56px) displaying the brand logo, active route indicator, theme toggle, and hamburger toggle button.
     - An accessible mobile drawer overlay (`role="dialog"`, `aria-modal="true"`, `aria-label="Navigation Menu"`, backdrop tap, Escape key dismissal) containing touch-friendly navigation rows (>=48px height) for all tabs (`ballot`, `leaderboard`, `grabbox`, `progress`, `docs`, `diagnostics` [staff-only], `settings`, legal links).
     - Ensure all mobile touch targets meet `>= 44×44px` (e.g. logo, theme toggle, hamburger toggle, user avatar button, close buttons).
   - Strictly preserve desktop floating pill on homepage (`.top-navbar`) and 64px right vertical rail on dashboard views at `>= 1024px`.
   - Ensure mobile navigation elements are strictly hidden on desktop via `@media (min-width: 768px) { ... display: none !important; }`.

4. **Settings Dropdown & Popover (`src/components/SettingsDropdown.tsx` & `src/styles.css`)**:
   - Fix `.account-overview-popover` positioning on mobile:
     - On desktop (`>= 768px`), retain anchored popover positioning.
     - On mobile (`< 768px`), render as an anchored modal/bottom sheet or fixed centered sheet with a dismissible backdrop, eliminating negative horizontal offsets that clip off-screen.
     - Ensure close button and theme toggle buttons meet `>= 44×44px` touch target size.

5. **Verification**:
   - Run `npm run typecheck` — MUST exit with code 0.
   - Run `npm run build` — MUST exit with code 0.
   - Verify that there are zero TypeScript, lint, or Vite build errors.

## Output Requirements
Write your detailed report of changes, verification commands, and test outputs to:
`/home/yierke/Documents/vote-ui/.agents/worker_m1_1/handoff.md`
Notify the Sub-orchestrator parent via send_message when complete.

## 2026-09-19T08:00:06Z
Received User Prompt:
You are the Worker for Milestone 1 of vote-ui.
Your Working Directory: /home/yierke/Documents/vote-ui/.agents/worker_m1_1
Project Directory: /home/yierke/Documents/vote-ui

