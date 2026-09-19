# Architecture, Tooling, Routing & Layout Survey Report

**Explorer**: Survey Explorer 1  
**Project**: `vote-ui` (`/home/yierke/Documents/vote-ui`)  
**Date**: 2026-09-19  
**Status**: Complete  

---

## Executive Summary

This survey provides a comprehensive architectural and responsive layout assessment of the `vote-ui` repository. The application is a high-performance React 18 + TypeScript single-page client bundled via Vite 6, styled through a monolithic 66 KB vanilla stylesheet (`src/styles.css`), and driven by internal state-based routing.

Key operational and architectural discoveries:
1. **Build & Tooling Status**: `npm run build` succeeds cleanly in ~1.2 seconds (`tsc && vite build`). However, **`npm run typecheck` currently fails with `npm error Missing script: "typecheck"`** because `package.json` lacks the script entry. Running `npx tsc --noEmit` succeeds with zero errors. No automated test runner (Vitest, Jest, Playwright) is currently configured.
2. **Styling System**: The project does **NOT** use Tailwind CSS or PostCSS; styling is entirely native CSS with CSS custom properties (`:root`, `[data-theme="light"]`, `[data-theme="dark"]`).
3. **Responsive Breakdown**: Across all 3,104 lines of CSS, there are only 8 `@media` rules, completely lacking standard mobile breakpoints (320px, 375px, 480px, 640px, 768px). The layout hardcodes desktop-first assumptions.
4. **Navigation & Wrappers**: The application has two distinct layout modes (`layout-homepage` and `layout-with-sidebar`), neither of which adapts to mobile viewports. On non-homepage views, a 64px vertical right rail stays pinned in a row flexbox, stealing critical width on mobile screens, while the homepage pill navbar overflows horizontally. No mobile hamburger menu, slide-out drawer, or bottom bar currently exists.
5. **Ballot Page Overflow**: On the ballot page, `.page-view-wrapper.page-non-scroll` sets `overflow: hidden; height: 100%`. When the 2-column grid collapses to 1 column at <=1024px, the ranked ballot slots and submit button are pushed off-screen and rendered completely inaccessible.

---

## 1. Tooling, Dependencies & Build Infrastructure

### 1.1 `package.json` Analysis
- **Package Name**: `@platform/vote-ui` (v1.0.0, private ES module)
- **Core Dependencies**:
  - `react`: `^18.3.1`
  - `react-dom`: `^18.3.1`
  - `@tanstack/react-query`: `^5.67.1` (with devtools `^5.67.1`)
  - `@platform/internal-logic`: `file:../vote-internals` (local sibling package containing consensus mathematics, Borda 3-2-1 count verification, and telemetry algorithms)
- **Dev Dependencies**:
  - `vite`: `^6.2.0`
  - `@vitejs/plugin-react`: `^4.3.4`
  - `typescript`: `^5.7.3`
  - `@types/react`: `^18.3.18`
  - `@types/react-dom`: `^18.3.5`

### 1.2 Script Execution & Missing Typecheck Script
- Existing scripts in `package.json`:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
  ```
- **Verification of `npm run typecheck`**:
  - **Observed Command**: `npm run typecheck`
  - **Result**: Exited with code 1:
    ```
    npm error Missing script: "typecheck"
    ```
  - **Direct Verification**: Running `npx tsc --noEmit` exited with code 0 (zero errors).
  - **Required Resolution**: Add `"typecheck": "tsc --noEmit"` to `package.json` scripts to satisfy automated verification.
- **Verification of `npm run build`**:
  - **Observed Command**: `npm run build`
  - **Result**: Exited with code 0 in 1.21s:
    - 121 modules transformed
    - Code-split output into 13 chunks (including `vendor-react` 134 kB, `vendor-query` 48 kB, `DevWorkbench` 103 kB, `ProgressPage` 32 kB, `DocsPage` 27 kB)
- **Test Infrastructure**:
  - No test runners (`vitest`, `jest`, `playwright`, `cypress`) are installed in `node_modules` or configured in `package.json`.
  - No unit or integration test files (`*.test.ts*`, `*.spec.ts*`) exist within the repository.

### 1.3 Bundler & Compiler Configuration
- **`vite.config.ts`**:
  - Configures React plugin `@vitejs/plugin-react`.
  - Sets up development reverse proxy for `/api` and `/health` to `process.env.VITE_API_URL` (default: `https://api.seraphinteractive.com`).
  - Sets path alias: `@platform/internal-logic` -> `resolve(__dirname, '../vote-internals/src/index.ts')`.
  - Custom Rollup chunking: splits `vendor-react` (`react`, `react-dom`) and `vendor-query` (`@tanstack/react-query`).
- **`tsconfig.json`**:
  - Target `ES2022`, module `ESNext`, `moduleResolution: "bundler"`, `noEmit: true`, `strict: true`.
  - Includes path mapping `"@platform/internal-logic": ["../vote-internals/src/index.ts"]`.
  - Includes paths `["src", "../vote-internals/src"]`.
- **`vercel.json`**:
  - Configures build command `npm run build`, output `dist`, install command `bash scripts/vercel-install.sh`.
  - Rewrites all paths `/(.*)` to `/index.html` for client-side routing.
  - Adds aggressive immutable caching for `/assets/(.*)`.

---

## 2. Styling Architecture & CSS Structure

### 2.1 Monolithic Architecture
- All application styles reside in a single file: `src/styles.css` (3,104 lines, 66 KB).
- There is **no PostCSS, Tailwind CSS, Sass, or CSS Modules**.
- Fonts loaded:
  - Local `@font-face`: `Neco` (Regular, Medium, Bold, Black, Variable) and `Minecraft` (Pixel font).
  - Google Fonts: `Plus Jakarta Sans`, `Inter`, `JetBrains Mono`.

### 2.2 Global Theming & Custom Property System
- Variables defined on `:root` / `[data-theme="light"]` and `[data-theme="dark"]`:
  - Backgrounds: `--bg-app`, `--bg-card`, `--bg-card-muted`, `--bg-card-hover`.
  - Texts: `--text-main`, `--text-muted`, `--text-light`.
  - Accents: `--accent-green`, `--accent-blue`, `--accent-gold`, `--accent-silver`, `--accent-bronze`.
  - Radius: `--radius-sm` (8px), `--radius-md` (14px), `--radius-lg` (20px), `--radius-xl` (28px).
- Display Compactness: `[data-compactness="cozy" | "compact" | "ultra-compact"]` scales card padding and table cell padding.
- High-contrast & Reduced-motion attributes: `[data-high-contrast="true"]`, `[data-reduced-motion="true"]`.

### 2.3 Universal CSS Overrides & Constraints
- Lines 145-147 and 224-238 enforce strict borderless styling:
  ```css
  *, *::before, *::after, .card, .white-card, ... {
    border: none !important;
    border-width: 0 !important;
    border-color: transparent !important;
    outline: none !important;
    box-shadow: none !important;
  }
  ```
- Universal scrollbar elimination:
  ```css
  ::-webkit-scrollbar, *::-webkit-scrollbar {
    display: none !important;
  }
  ```

### 2.4 Breakpoint Inventory & Fragmentation
Across all 3,104 lines of `styles.css`, only 8 media queries exist:
| File Line | Query | Affected Selector(s) | Behavior |
|---|---|---|---|
| Line 1256 | `@media (max-width: 900px)` | `.landing-metrics-grid` | 4 cols -> 2 cols |
| Line 1310 | `@media (max-width: 900px)` | `.landing-showcase-card`, `.reverse` | 2 cols -> 1 col |
| Line 1477 | `@media (max-width: 800px)` | `.ballot-slots` | 3 cols -> 1 col |
| Line 2217 | `@media (max-width: 960px)` | `.metrics-row, .graphs-row` | 3/2 cols -> 1 col |
| Line 2353 | `@media (max-width: 900px)` | `.bottom-submitters-row` | 3 cols -> 1 col |
| Line 2459 | `@media (max-width: 860px)` | `.ballot-pedestals-grid` | 3 cols -> 1 col |
| Line 2542 | `@media (max-width: 680px)` | `.podium-container` | `flex-direction: column` |
| Line 2762 | `@media (max-width: 1024px)` | `.vote-layout-grid` | 1.15fr 1fr -> 1fr |

**Deficiencies**:
- No mobile breakpoints for 320px, 375px, 480px, 640px, or 768px.
- Zero media queries exist for `.top-navbar`, `.right-nav-rail`, `.app-root-layout`, `.settings-page-layout`, `.dashboard-container`, `.landing-hero`, `.thought-bubble-popover`, or modal backdrops.

---

## 3. Application Routing & Page Map

### 3.1 Routing Mechanism
The application does not use URL-based routing (e.g. `react-router-dom` or HTML5 History API). It employs state-driven routing managed by `activeTab` (`useState<NavTabId>('landing')`) in `src/App.tsx`.

```typescript
export type NavTabId =
  | 'landing'
  | 'ballot'
  | 'leaderboard'
  | 'docs'
  | 'grabbox'
  | 'diagnostics'
  | 'settings'
  | 'progress'
  | 'privacy'
  | 'terms'
  | 'guidelines';
```

Transition between tabs is managed via `handleTabChange`:
- Triggered by Navbar buttons, Command Palette (`Cmd+K`), in-page CTA buttons, or Footer links.
- Uses `BlazeTransitionOverlay` for a cinematic wipe transition unless `reducedMotion` is enabled.

### 3.2 Page Map & Lazy-Loading Hierarchy

| Tab ID | Component Path | Loading Strategy | Purpose & Layout Constraints |
|---|---|---|---|
| `landing` | `src/views/Landing/LandingPage.tsx` | Eager | Hero banner, tracks showcase, production overview, community footer. Scrollable. |
| `ballot` | `src/views/VoterApp/VotePage.tsx` | Eager | 2-column interface: left candidate roller/detail view, right 3-tier ranked ballot slots. Non-scrollable parent container. |
| `leaderboard` | `src/views/VoterApp/PublicLeaderboard.tsx` | Eager | Sticky banner, 3D top-3 podium, paginated table of scores. Scrollable. |
| `docs` | `src/views/Docs/DocsPage.tsx` | Lazy (`React.lazy`) | Wikipedia-style article, sticky banner, infobox, table of contents, technical specifications. |
| `grabbox` | `src/views/GrabBox/GrabBoxPage.tsx` | Lazy (`React.lazy`) | Minimal centered card placeholder for 3D shot task dispatching. |
| `progress` | `src/views/Progress/ProgressPage.tsx` | Lazy (`React.lazy`) | 17-sub-stage milestone pipeline slider, organic update feed with filter pills and modal composer. |
| `diagnostics` | `src/views/DevWorkbench/DevWorkbench.tsx` | Lazy (`React.lazy`) | Staff-only console (`isStaff(user?.role)`): pitch moderation, moment charts, Shannon entropy raid telemetry, network telemetry. |
| `settings` | `src/views/Settings/SettingsPage.tsx` | Lazy (`React.lazy`) | 2-column desktop layout with sticky sidebar and auto-scrolling subsections (profile, appearance, accessibility, account). |
| `privacy` | `src/views/Legal/PrivacyPage.tsx` | Lazy (`React.lazy`) | Legal document view with sticky header and community footer. |
| `terms` | `src/views/Legal/TermsPage.tsx` | Lazy (`React.lazy`) | Terms of service document view with sticky header and community footer. |
| `guidelines` | `src/views/Legal/GuidelinesPage.tsx` | Lazy (`React.lazy`) | Community standards document with sticky header and community footer. |

---

## 4. Layout Wrappers & Navigation System

### 4.1 Root Layout Structure (`src/App.tsx`)
In `App.tsx` (lines 188-426), the outer layout wraps the `<Navbar>`, the `<main className="dashboard-container">`, transition overlays, modals, and the footer:

```tsx
<div className={`app-root-layout ${isHomePage ? 'layout-homepage' : 'layout-with-sidebar'}`}>
  <Navbar ... />
  <main className={`dashboard-container ${isHomePage ? 'container-homepage' : 'container-sidebar'}`}>
    <div key={activeTab} className={`page-view-wrapper ${isBallotPage ? 'page-non-scroll' : 'page-scrollable'}`}>
      {/* Active Tab View */}
    </div>
  </main>
  ...
</div>
```

#### The Two Layout Modes:
1. **Homepage Mode (`layout-homepage`)**:
   - `.app-root-layout.layout-homepage`: `flex-direction: column; overflow-y: auto; overflow-x: hidden; height: 100vh;`
   - `.dashboard-container.container-homepage`: `max-width: 1600px; margin: 0 auto; padding: 84px 32px 24px;`
   - Navbar: Floating fixed pill (`.top-navbar-fixed-container`).
   - Footer: Rendered both at the bottom of `LandingPage.tsx` (`<Footer />`) and conditionally in `App.tsx` lines 400-424.
2. **Sidebar / Rail Mode (`layout-with-sidebar`)**:
   - `.app-root-layout.layout-with-sidebar`: `flex-direction: row; padding: 12px; gap: 14px; overflow: hidden; height: 100vh;`
   - `.dashboard-container.container-sidebar`: `max-width: 100%; padding: 4px 8px; height: calc(100vh - 24px); overflow: hidden;`
   - Navbar: Fixed vertical right rail (`.right-nav-rail`), width 64px, `order: 2`.

### 4.2 Navigation Component (`src/components/Navbar.tsx`)
The `Navbar` renders conditionally based on `isHomePage` (`activeTab === 'landing'`):

#### Mode A: Right Navigation Rail (`!isHomePage`)
- Rendered as an `<aside className="right-nav-rail">`:
  - Fixed width: `64px`, height: `calc(100vh - 24px)`.
  - Brand mark at top (`.right-nav-top`).
  - Menu icon buttons at center (`.right-nav-menu`): Vote, Leaderboard, GrabBox, Progress, Docs, Dashboard (staff only).
  - Bottom action stack (`.right-nav-bottom`): Theme toggle, Discord avatar / Sign-in button with `<SettingsDropdown />`.
  - Tooltips: Minecraft-styled hover popups (`.minecraft-tooltip-panel`) positioned to the left.

#### Mode B: Top Floating Navbar (`isHomePage`)
- Rendered as `<header className="top-navbar-fixed-container">`:
  - Contains `.top-navbar`: `max-width: 1480px; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-radius: var(--radius-xl);`.
  - Left side: Brand logo mark + `.nav-menu` containing 5-6 text buttons ("Vote", "Leaderboard", "GrabBox", "Progress", "Docs", "Dashboard").
  - Right side: Theme toggle icon button + Discord avatar button / "Sign in with Discord" button.
  - Scroll-aware hiding: Controlled by `useScrollDirection()` hook (`nav-visible` vs `nav-hidden`).

---

## 5. Mobile Responsiveness & Touch Ergonomics Vulnerability Analysis

A rigorous inspection of component layouts against viewports between 320px and 768px reveals severe layout, accessibility, and interaction deficiencies:

### 5.1 Critical Navigation Flaws
1. **Total Absence of Mobile Navigation**:
   - No hamburger menu toggle.
   - No mobile navigation drawer / sheet.
   - No bottom navigation tab bar.
2. **Right Rail Screen Cannibalization on Small Screens**:
   - In `layout-with-sidebar`, the layout remains `flex-direction: row`.
   - On a 360px viewport: 12px left padding + 14px gap + 64px rail + 12px right padding = 102px consumed by the navigation wrapper.
   - This leaves only ~258px for the main application view (`.dashboard-container`).
3. **Homepage Top Navbar Horizontal Overflow**:
   - The desktop `.nav-menu` renders 5 buttons side-by-side with `padding: 8px 16px` plus logo and login button. Total unconstrained width exceeds 580px. On viewports below 600px, this causes horizontal overflow, overlapping elements, or text clipping.
4. **Account Overview Popover Clipping**:
   - `.account-overview-popover` is hardcoded to `width: 300px` with `right: calc(100% + 14px)` on the right rail. On mobile viewports (< 378px), this popover extends beyond the left edge of the screen and is cut off.

### 5.2 Critical Page Layout & Scroll Breakages
1. **Vote Page Inaccessibility on Mobile (`VotePage.tsx`)**:
   - `App.tsx` line 203 & 229 sets `page-non-scroll` (`overflow: hidden; height: 100%`) for the ballot tab.
   - In `styles.css` line 2762, `.vote-layout-grid` stacks to 1 column at `<= 1024px`.
   - Result: The second column (containing the 3 ranked ballot slots, point summaries, and the ballot submission button) is placed below the candidate roller. Because the parent container has `overflow: hidden`, **mobile users cannot scroll down to see or fill their ballot slots, making voting impossible on mobile**.
2. **HTML5 Drag-and-Drop Incompatibility with Touch**:
   - Ballot slots in `VotePage.tsx` (lines 521-650) rely strictly on HTML5 drag-and-drop (`onDragStart`, `onDragOver`, `onDrop`).
   - Mobile browsers (iOS Safari, Android Chrome) do not support native HTML5 drag-and-drop without touch-event synthesizers.
   - Although candidate cards have a tap-to-select callback (`onSelectEntryForVote`), the slot rearrangement and clearing interactions lack touch-friendly tap/swap controls.
3. **Settings Page 2-Column Lockup (`SettingsPage.tsx`)**:
   - `.settings-page-layout` is hardcoded to `grid-template-columns: 280px 1fr; gap: 28px;` with no media queries.
   - On viewports < 768px, the 280px navigation card alone consumes almost the entire screen width, causing extreme horizontal overflow.
4. **Docs Page Fixed 300px Infobox (`DocsPage.tsx`)**:
   - `DocsPage.tsx` line 120 sets inline style: `gridTemplateColumns: '1fr 300px', gap: 32`.
   - On viewports < 768px, this inline grid does not collapse, forcing the document wider than the viewport and creating severe horizontal scrolling.
5. **Progress Timeline 17-Sub-Stage Crunch (`ProgressPage.tsx`)**:
   - `ProgressPage.tsx` line 375 uses inline style `gridTemplateColumns: '3fr 4fr 5fr 5fr'` across 17 sub-stages on a desktop timeline. On mobile, this compresses buttons and milestone labels to under 15px width.

### 5.3 Modals & Touch Target Violations
1. **Desktop Centered Modals**:
   - `CreatePitchModal.tsx` and `CreateRoundModal.tsx` use inline styles with `display: 'flex', alignItems: 'center', justifyContent: 'center'`.
   - On mobile screens, they appear as squished desktop popups with 20px margins rather than native mobile bottom sheets.
2. **Sub-44px Touch Targets**:
   - Close buttons: 30×30px (`CreatePitchModal.tsx` line 197).
   - Thought bubble trigger: 32×32px (`styles.css` line 2704).
   - Profile button: 38×38px (`Navbar.tsx` line 210).
   - Preset chips / clear buttons: `padding: '2px 8px', fontSize: '11px'`.
   - Compact button mode (`[data-compactness="compact"]`): `padding: 3px 8px !important`.

---

## 6. Modern Web Implementation Blueprint

In accordance with `modern-web-guidance` and user requirements R1-R3:

### 6.1 Standardized Responsive Breakpoints
Define semantic mobile-first breakpoints in `src/styles.css`:
- **Mobile (`< 768px`)**: Single-column flows, bottom navigation bar or drawer, full-width bottom sheets, 44px touch minimums.
- **Tablet (`768px - 1023px`)**: Compact 2-column grids, collapsible sidebars.
- **Desktop (`>= 1024px`)**: Full desktop fidelity, floating pill navbar on landing, right vertical rail on dashboard views.

### 6.2 Responsive Navigation Strategy
1. **On Screens < 768px**:
   - Transform `layout-with-sidebar` into a column layout (`flex-direction: column`).
   - Replace the desktop 64px right rail with either:
     - A thumb-friendly fixed **Bottom Navigation Bar** with primary actions (Home, Vote, Leaderboard, More).
     - Or an accessible **Slide-over Navigation Drawer** triggered via a 44×44px hamburger button in a lightweight sticky top header.
   - On the Homepage, replace the horizontal text link menu with the same hamburger toggle or compact icon group.
2. **Account Popover on Mobile**:
   - Reposition `.account-overview-popover` to center-bottom or slide up as a mobile drawer instead of popping out to `right: calc(100% + 14px)`.

### 6.3 Layout & Viewport Fixes
1. **Ballot Page Wrapper**:
   - Change `.page-view-wrapper.page-non-scroll` on viewports < 1024px to allow `overflow-y: auto`, enabling users to scroll from the candidate pool down to the ballot pedestals and submit button.
2. **Settings Page Layout**:
   - Change `.settings-page-layout` at `< 768px` to `grid-template-columns: 1fr;` with a horizontal sticky scroll chip bar for subsection navigation.
3. **Docs & Progress Layouts**:
   - Collapse `gridTemplateColumns: '1fr 300px'` in `DocsPage.tsx` to 1 column at `< 768px`.
   - Make the 17-sub-stage milestone pipeline in `ProgressPage.tsx` horizontally scrollable with snap stops on mobile.

### 6.4 Touch Ergonomics & Mobile Modals
1. **Touch Targets**:
   - Ensure all clickable triggers (`icon-btn`, `thought-bubble-trigger`, modal close, clear buttons, nav items) have `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`.
2. **Bottom Sheet Modals**:
   - Update `CreatePitchModal.tsx` and `CreateRoundModal.tsx` so that at `< 768px`, the modal aligns to `flex-end` (bottom), spans 100% viewport width, features rounded top corners (`border-radius: 20px 20px 0 0`), an accessible drag handle, and max-height `85vh` with smooth slide-up entry.
3. **Tap-to-Rank Ballot Workflow**:
   - Augment `VotePage.tsx` so mobile users can tap a candidate card and tap a slot (or tap quick "1st", "2nd", "3rd" rank badges directly on the card) to assign and reorder ranks without needing HTML5 drag-and-drop.

### 6.5 Tooling Enhancement
- Add `"typecheck": "tsc --noEmit"` to `package.json` `scripts` so both `npm run typecheck` and `npm run build` execute flawlessly with zero errors.

---
*Report compiled by Survey Explorer 1.*
