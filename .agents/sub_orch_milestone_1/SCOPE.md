# Scope: Milestone 1 (Tooling, Responsive Breakpoints & Navigation)

## Architecture
- Framework: React 18.3.1 (SPA), TypeScript 5.7.3, Vite 6.2.0
- Stylesheet: Monolithic vanilla `src/styles.css` with CSS custom properties
- Navigation:
  - Desktop (>= 1024px): Preserves floating top pill navbar (homepage) and 64px vertical right rail (dashboard views).
  - Mobile (< 768px): Collapses 64px right rail; implements responsive mobile navigation (e.g. mobile bottom bar or top header hamburger drawer) with 44×44px touch targets.
  - Layout wrappers: `.app-root-layout.layout-with-sidebar` switches to `flex-direction: column` on mobile; `.page-view-wrapper.page-non-scroll` unlocks vertical scrolling (`overflow-y: auto`) on viewports < 1024px.
  - Settings dropdown / account popover repositioned on mobile to avoid negative X off-screen rendering.

## Feature Inventory (Milestone 1 Scope)
| # | Feature | Description | Milestone | Status |
|---|---------|-------------|-----------|--------|
| 1 | Tooling & Typecheck Script | Add `"typecheck": "tsc --noEmit"` to `package.json` scripts | M1 | PENDING |
| 2 | Semantic Responsive Breakpoints | Establish standard mobile (<768px), tablet (768-1023px), desktop (>=1024px) queries in `styles.css` | M1 | PENDING |
| 3 | Mobile Navigation Pattern | Accessible mobile navigation (bottom bar or hamburger drawer) replacing 64px right rail on <768px | M1 | PENDING |
| 4 | Account Popover Positioning | Reposition account overview popover on mobile so it does not render off-screen at negative X | M1 | PENDING |
| 5 | Page Wrapper Mobile Scroll Unlocking | Allow `overflow-y: auto` on `.page-view-wrapper` on viewports <1024px | M1 | PENDING |

## Files Owned Exclusively
- `package.json`
- `src/styles.css` (navigation, layout wrappers, and global breakpoint sections)
- `src/App.tsx` (layout wrapper responsiveness and mobile navigation integration)
- `src/components/Navbar.tsx` (mobile navigation header/bar alongside existing desktop navbar & right rail)
- `src/components/SettingsDropdown.tsx` (responsive positioning & touch ergonomics)

## Interface Contracts
### Navigation ↔ Page View Wrappers
- Breakpoint boundary: `@media (max-width: 767px)` triggers mobile mode; `@media (min-width: 768px)` triggers desktop/tablet mode.
- In mobile mode:
  - `.app-root-layout.layout-with-sidebar` has `flex-direction: column; height: 100vh; overflow-y: auto; overflow-x: hidden;`.
  - Right rail `.right-nav-rail` is hidden from document flow or collapsed; navigation is provided by mobile navigation bar/drawer.
  - Active tab switching retains exact `handleTabChange(tab: NavTabId)` contract.
  - Interactive touch targets adhere to `>= 44×44px`.
- Desktop preservation (>= 1024px):
  - `.top-navbar` on homepage intact.
  - `.right-nav-rail` (64px) on dashboard views intact with tooltips and Discord avatar popover.
