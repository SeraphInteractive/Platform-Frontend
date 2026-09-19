# Handoff Report: Architecture, Tooling, Routing & Layout Survey

**Agent**: Survey Explorer 1  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_1`  
**Target Path**: `/home/yierke/Documents/vote-ui`  
**Handoff Type**: Hard (Investigation Complete)  
**Date**: 2026-09-19  

---

## 1. Observation

### 1.1 Tooling, Scripts & Build Execution
- **`package.json`**: Located at `/home/yierke/Documents/vote-ui/package.json`. Lines 6-10 define scripts:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
  ```
- **Execution of `npm run typecheck`**:
  - Command: `npm run typecheck`
  - Exit code: `1`
  - Output verbatim:
    ```
    npm error Missing script: "typecheck"
    npm error
    npm error To see a list of scripts, run:
    npm error   npm run
    ```
- **Execution of `npx tsc --noEmit`**:
  - Command: `npx tsc --noEmit`
  - Exit code: `0` (zero errors, clean completion).
- **Execution of `npm run build`**:
  - Command: `npm run build`
  - Exit code: `0`
  - Output snippet:
    ```
    vite v6.4.3 building for production...
    ✓ 121 modules transformed.
    dist/index.html                           1.82 kB │ gzip:  0.75 kB
    dist/assets/index-DdJu3rfK.css           50.55 kB │ gzip:  9.44 kB
    dist/assets/vendor-query-Vo-4QPjr.js     48.72 kB │ gzip: 14.91 kB
    dist/assets/index-D9fvYWGi.js           101.74 kB │ gzip: 23.91 kB
    dist/assets/DevWorkbench-B1c2U5Bg.js    103.41 kB │ gzip: 24.47 kB
    dist/assets/vendor-react-BYSx_nOI.js    134.67 kB │ gzip: 43.24 kB
    ✓ built in 1.21s
    ```
- **Test Infrastructure**:
  - Pattern search for `*test*` and `*spec*` revealed no test runners (`vitest`, `jest`) in `package.json` and zero test files in `src/`.

### 1.2 Styling Framework & Media Queries
- **Absence of Tailwind / PostCSS**: Ripgrep search for `tailwind` across `/home/yierke/Documents/vote-ui` found no config files (`tailwind.config.*`, `postcss.config.*`) and no tailwind dependencies in `package.json`.
- **Single Monolithic Stylesheet**: Located at `/home/yierke/Documents/vote-ui/src/styles.css` (3,104 lines, 66 KB).
- **Media Queries in `src/styles.css`**: Ripgrep search for `@media` found exactly 8 queries:
  - Line 1256: `@media (max-width: 900px)` (.landing-metrics-grid)
  - Line 1310: `@media (max-width: 900px)` (.landing-showcase-card)
  - Line 1477: `@media (max-width: 800px)` (.ballot-slots)
  - Line 2217: `@media (max-width: 960px)` (.metrics-row, .graphs-row)
  - Line 2353: `@media (max-width: 900px)` (.bottom-submitters-row)
  - Line 2459: `@media (max-width: 860px)` (.ballot-pedestals-grid)
  - Line 2542: `@media (max-width: 680px)` (.podium-container)
  - Line 2762: `@media (max-width: 1024px)` (.vote-layout-grid)
- **Aggressive Overrides**: Lines 145-147 and 224-238 apply `border: none !important; outline: none !important; box-shadow: none !important;` to all elements, and scrollbars are hidden globally via `display: none !important`.

### 1.3 Routing, Layout Wrappers & Navigation
- **Routing**: `src/App.tsx` lines 65 and 188-358 implement internal tab state (`useState<NavTabId>('landing')`) across 11 views: `landing`, `ballot`, `leaderboard`, `docs`, `grabbox`, `diagnostics`, `settings`, `progress`, `privacy`, `terms`, `guidelines`.
- **Layout Wrappers in `src/App.tsx`**:
  - Line 189: `<div className={'app-root-layout ${isHomePage ? 'layout-homepage' : 'layout-with-sidebar'}'}>`
  - Line 202: `<main className={'dashboard-container ${isHomePage ? 'container-homepage' : 'container-sidebar'}'}>`
  - Line 203: `<div key={activeTab} className={'page-view-wrapper ${isBallotPage ? 'page-non-scroll' : 'page-scrollable'}'}>`
- **Layout Styling in `src/styles.css`**:
  - Lines 307-314:
    ```css
    .app-root-layout.layout-with-sidebar {
      flex-direction: row;
      padding: 12px;
      gap: 14px;
      box-sizing: border-box;
      overflow: hidden;
      height: 100vh;
    }
    ```
  - Lines 450-465:
    ```css
    .right-nav-rail {
      width: 64px;
      height: calc(100vh - 24px);
      ...
    }
    ```
  - Lines 351-354:
    ```css
    .page-view-wrapper.page-non-scroll {
      overflow: hidden;
      height: 100%;
    }
    ```
  - Line 2762:
    ```css
    @media (max-width: 1024px) {
      .vote-layout-grid {
        grid-template-columns: 1fr;
      }
    }
    ```
- **Navigation in `src/components/Navbar.tsx`**:
  - Lines 36-261: If `!isHomePage`, renders vertical `<aside className="right-nav-rail">` with 64px width and icon buttons.
  - Lines 264-391: If `isHomePage`, renders `<header className="top-navbar-fixed-container">` containing `.top-navbar` with horizontal `.nav-menu` (5 buttons), theme button, and Discord login button.
  - No hamburger menu button, no mobile drawer, no bottom navigation bar exists in `Navbar.tsx`.

### 1.4 Modals & Touch Targets
- `src/components/CreatePitchModal.tsx` line 160-173 and `src/components/CreateRoundModal.tsx` line 58-74 use inline styles with `position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'` (desktop-centered popups).
- Multiple interactive elements are smaller than 44×44px: modal close button (30×30px, `CreatePitchModal.tsx:197`), thought bubble trigger (32×32px, `styles.css:2704`), profile button (38×38px, `Navbar.tsx:210`), and slot clear button (`VotePage.tsx:532`).

---

## 2. Logic Chain

1. **Build & Tooling**:
   - Observation: `npm run typecheck` fails with `Missing script: "typecheck"`, while `npx tsc --noEmit` succeeds with 0 errors.
   - Inference: Adding `"typecheck": "tsc --noEmit"` to `package.json` scripts will immediately allow `npm run typecheck` to execute and pass cleanly without any other code changes.
2. **Styling & Breakpoints**:
   - Observation: All styles are in `src/styles.css` with only 8 desktop/tablet media queries and zero mobile queries (< 768px). No Tailwind is present.
   - Inference: Mobile responsiveness must be implemented directly in `src/styles.css` (or modular CSS/React styling) using standardized mobile breakpoints (`< 768px`), without attempting to import or configure Tailwind utilities unless deliberately installed.
3. **Navigation Architecture**:
   - Observation: `Navbar.tsx` renders a 64px vertical right rail in `layout-with-sidebar` and a wide horizontal pill navbar in `layout-homepage`. Neither has mobile media queries.
   - Inference: On mobile screens (320px-768px), the 64px rail consumes ~102px of width (with padding/gap), and the homepage navbar overflows horizontally. Mobile viewports require a dedicated mobile navigation pattern (such as a bottom navigation bar or a mobile slide-out drawer) and the removal of the 64px right rail on small screens.
4. **Ballot Page Mobile Inaccessibility**:
   - Observation: `.page-view-wrapper.page-non-scroll` locks `overflow: hidden; height: 100%`, while `.vote-layout-grid` stacks to 1 column at <= 1024px. The right column holds the ballot drop slots and submit button.
   - Inference: When stacked to 1 column, the ballot slots and submit button are positioned below the viewport and cannot be scrolled to because the wrapper forbids scrolling. Mobile users are blocked from casting votes. Making the wrapper vertically scrollable (`overflow-y: auto`) on mobile viewports is essential.
5. **Modal Ergonomics**:
   - Observation: Modals are styled with inline `alignItems: 'center'` and fixed padding.
   - Inference: Transforming them into bottom sheets on mobile requires shifting alignment to `flex-end`, applying full width with top rounded corners, adding touch handles, and attaching smooth slide-up CSS transitions.

---

## 3. Caveats

1. **Sibling Dependency Requirement**: The build and typecheck processes rely on `@platform/internal-logic` located at `../vote-internals/src/index.ts`. Any environment executing the build must have the sibling directory present or cloned (as handled by `scripts/vercel-install.sh`).
2. **State-Driven Routing**: Because there is no URL router, deep linking to specific pages or sub-sections (e.g., `/ballot`, `/leaderboard`) is currently not supported via browser path. Changes to routing should preserve the existing `activeTab` contract in `App.tsx` unless the team decides to introduce browser hash/path routing.
3. **Internal Logic Integrity**: As instructed, no modifications to business logic or consensus calculations in `@platform/internal-logic` were attempted or recommended.

---

## 4. Conclusion

The application has a robust TypeScript and Vite foundation that builds quickly and cleanly, but its layout and navigation are strictly desktop-bound. To fulfill the user's mobile responsiveness and touch ergonomics requirements (R1–R3):

1. **Tooling**: Add `"typecheck": "tsc --noEmit"` to `package.json` scripts.
2. **Navigation**: Implement an accessible mobile navigation system (hamburger drawer or bottom bar) for viewports `< 768px`, and collapse the 64px vertical right rail.
3. **Layout Wrappers**: Update `.app-root-layout.layout-with-sidebar` to stack vertically on mobile, and enable vertical scrolling on `.page-view-wrapper.page-non-scroll` on viewports `< 1024px` so ballot slots and the submit button remain fully accessible.
4. **Modals & Ergonomics**: Convert centered dialogs to mobile bottom sheets on small screens and enlarge all interactive targets to >= 44×44px.
5. **Multi-Column Views**: Convert `SettingsPage` (280px sidebar), `DocsPage` (300px infobox), and `ProgressPage` (17-sub-stage timeline) into responsive single-column or horizontally scrolling mobile experiences.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Missing Script**:
   ```bash
   cd /home/yierke/Documents/vote-ui && npm run typecheck
   ```
   Confirm exit code 1 with `npm error Missing script: "typecheck"`.
2. **Verify Typecheck Execution**:
   ```bash
   cd /home/yierke/Documents/vote-ui && npx tsc --noEmit
   ```
   Confirm exit code 0 with zero TypeScript errors.
3. **Verify Production Build**:
   ```bash
   cd /home/yierke/Documents/vote-ui && npm run build
   ```
   Confirm exit code 0 and successful output in `dist/`.
4. **Verify Media Query Inventory**:
   ```bash
   rg -n "@media" /home/yierke/Documents/vote-ui/src/styles.css
   ```
   Confirm exactly 8 media queries and absence of standard mobile breakpoints (< 768px).
5. **Inspect Artifacts**:
   - Detailed survey report: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_1/survey_report.md`
   - Dispatch record: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_1/DISPATCH.md`
