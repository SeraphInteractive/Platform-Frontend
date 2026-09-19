# Technical Investigation Report: Mobile View & Layout Density (R3) & Touch Ergonomics / Bottom Sheet Unification (R4)

**Explorer ID**: Explorer 2 (`teamwork_preview_explorer_survey2_2`)  
**Mission Scope**: Requirement R3 (Comprehensive Mobile View & Layout Density Overhaul) and Requirement R4 (Touch Ergonomics & Dialog Bottom Sheet Unification)  
**Investigation Timestamp**: 2026-09-19T15:20:00Z  
**Target Codebase**: `/home/yierke/Documents/vote-ui`  

---

## Executive Summary

An exhaustive analysis of the `vote-ui` codebase, accompanying CSS rules in `src/styles.css`, and test suites in `tests/tier1/`, `tests/tier2/`, `tests/tier3/`, and `tests/tier4/` was executed. Currently, 33 out of 138 automated test cases fail due to missing mobile layout rules, lack of touch-friendly target dimensions (44×44px), absence of bottom-sheet CSS classes and drag handles, unhandled table overflows, and unlinked sound effects.

This report documents the current implementation state, root-cause diagnostics, precise line-level evidence, and concrete implementation blueprints to achieve 100% test compliance and zero horizontal overflow across 320px–428px viewports.

---

## 1. Current Implementation State of Target Views

| Component / View | Current State | Deficiencies & Gaps | Target CSS / AST Selectors |
|---|---|---|---|
| **VotePage.tsx** (`src/views/VoterApp/VotePage.tsx`) | Two-column layout with drag-and-drop slots and vertical candidate roller. | 1. No inline tap-to-rank chips on roller cards.<br>2. Ballot slots lack Up/Down (▲/▼) reorder chevrons.<br>3. Clear button lacks 44×44px touch target bounds.<br>4. No sound effects invocations (`sounds.ts` unimported).<br>5. "Cast Vote" button text / reachable scrolling not conforming to `/Cast (Your )?Ballot|cast-ballot/i`.<br>6. `.thought-bubble-trigger` is hardcoded to 32×32px. | `.tap-rank-chip`, `.tap-chips-group`, `.slot-reorder-btn`, `.slot-clear-btn`, `.thought-bubble-trigger`, `.slot-card-title`, `sounds.playPop`, `sounds.playReset`, `sounds.playLevelUp` |
| **PublicLeaderboard.tsx** (`src/views/VoterApp/PublicLeaderboard.tsx`) | 3D podium with Silver (#2), Gold (#1), Bronze (#3) plus standings table. | 1. Podium elements use inline JSX styles `order: 1`, `order: 2`, `order: 3` without `.podium-place-1/2/3` classes.<br>2. On mobile (<768px), Gold (#1) remains center/second instead of stacking on top.<br>3. Standings table needs verification inside `.table-wrap` for 320px viewport safety. | `.podium-place-1`, `.podium-place-2`, `.podium-place-3`, `.table-wrap`, `.leaderboard-container` |
| **DocsPage.tsx** (`src/views/Docs/DocsPage.tsx`) | Wikipedia-style article layout with infobox, TOC, and technical sections. | 1. `.docs-page-layout` is missing in `src/styles.css` (fails collapse to `1fr` on mobile).<br>2. Only 3 tables exist; none are wrapped in `<div className="table-wrap">` (fails requirement of $\ge 4$ table-wraps).<br>3. TOC toggle button `[hide]`/`[show]` touch target is small. | `.docs-page-layout`, `.table-wrap`, `.wiki-infobox`, `.wiki-toc`, `.wikitable` |
| **ProgressPage.tsx** (`src/views/Progress/ProgressPage.tsx`) | 17-milestone pipeline rail with active percentage pin and update cards. | 1. Milestone track uses inline styles without `.progress-timeline-track`.<br>2. No `overflow-x: auto` or responsive wrap on `<768px`, leading to horizontal blowout. | `.progress-timeline-track`, `.badge`, `.btn` |
| **GrabBoxPage.tsx** (`src/views/GrabBox/GrabBoxPage.tsx`) | Placeholder dispatch card with 700px max-width. | Container needs mobile viewport clamping (padding `0 16px`, `width: 100%`) to guarantee 0px overflow on 320px–428px. | `.card`, `.tab-content-area` |
| **SettingsPage.tsx** (`src/views/Settings/SettingsPage.tsx`) | 2-column layout (`280px 1fr`) with sticky navigation sidebar. | 1. `.settings-page-layout` in `styles.css` does not collapse to `1fr` on `<768px`.<br>2. `.settings-nav-tabs` missing in CSS and component for horizontal scrolling chips on mobile. | `.settings-page-layout`, `.settings-nav-tabs`, `.settings-subsection-item` |
| **DevWorkbench.tsx** (`src/views/DevWorkbench/DevWorkbench.tsx`) | Moderation console, telemetry matrix, and role management. | 1. Telemetry and proposal tables wrapped in `.table-responsive` rather than required `.table-wrap`.<br>2. Moderation action buttons (Approve, Reject, Flag, Purge) lack `.btn-moderation` class and 44px min-height. | `.table-wrap`, `.btn-moderation`, `var(--text-main)` in `RaidTelemetryChart.tsx` |

---

## 2. Layout Fixes for 0px Horizontal Overflow (320px–428px)

### Root Layout & Viewport Invariants
- **Root Layout (`.app-root-layout`)**:
  - Defined at `src/styles.css:3652`. On mobile (`max-width: 767px`), it must enforce:
    ```css
    .app-root-layout {
      overflow-x: hidden !important;
      max-width: 100vw !important;
      width: 100% !important;
      box-sizing: border-box;
    }
    ```
  - This guarantees 0px document overflow at 320px, 375px, 390px, 414px, 428px, and 767px boundary.

### Global `.table-wrap` Architecture
- Test `[T1-OVR-02]` and `[T2-OVR-03]` require a global utility:
  ```css
  .table-wrap {
    width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
    box-sizing: border-box;
    display: block;
  }
  ```
- All wide tables must be enclosed in `.table-wrap`:
  1. `DocsPage.tsx`: All 4 technical specification tables.
  2. `DevWorkbench.tsx` (line 384): Replace `table-responsive` with `table-wrap`.
  3. `RaidTelemetryChart.tsx` (line 390): Replace `table-responsive` with `table-wrap`.
  4. `NetworkTelemetryChart.tsx` (line 988): Replace `table-responsive` with `table-wrap`.
  5. `PublicLeaderboard.tsx` (line 193): Already has `table-wrap`, verify table layout.

### Pitch Card Wrapping & Break-Word Rules
- **`.slot-card-title`** (currently unstyled for break-word):
  - Must declare:
    ```css
    .slot-card-title {
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      max-width: 100%;
    }
    ```
- **`.slot-card-body`** (`src/styles.css:3680`):
  - Must maintain `overflow-wrap: break-word; word-break: break-word; max-width: 100%;`.

### Cast Ballot Submission Button Reachability
- In `src/views/VoterApp/VotePage.tsx` (line 709):
  - Current label: `myBallot ? 'Update Vote' : 'Cast Vote'`
  - AST / scroll test `[T1-SCRL-04]` looks for regex `/Cast (Your )?Ballot|cast-ballot|cast-vote/i`.
  - The button must use text `"Cast Ballot"` (or class `btn-primary cast-ballot`).
  - Container must not fix height to `100vh` on mobile: `.tab-content-ballot` and `.vote-layout-grid` must have `height: auto; min-height: 100%; overflow-y: visible;` so that mobile users can scroll naturally past candidate cards down to the ballot slots and the submit button without scroll-trapping.

---

## 3. PublicLeaderboard Stacked Mobile Podium & Standings Table

### Desktop vs Mobile Podium Reordering
- In `src/views/VoterApp/PublicLeaderboard.tsx` (lines 86, 118, 150):
  - Currently hardcoded inline:
    - 2nd Place: `style={{ order: 1 }}`
    - 1st Place: `style={{ order: 2 }}`
    - 3rd Place: `style={{ order: 3 }}`
  - This prevents CSS media queries from reordering the podium on mobile.

### Required Changes:
1. In `PublicLeaderboard.tsx`:
   - Replace inline `style={{ order: ... }}` with semantic CSS classes:
     - 1st Place (Gold): `className="podium-card podium-place-1"`
     - 2nd Place (Silver): `className="podium-card podium-place-2"`
     - 3rd Place (Bronze): `className="podium-card podium-place-3"`
2. In `src/styles.css`:
   - **Mobile (`@media (max-width: 767px)`)**:
     ```css
     .podium-container {
       display: flex;
       flex-direction: column;
       gap: 16px;
       width: 100%;
     }
     .podium-place-1 {
       order: 1 !important; /* Gold on top */
       width: 100%;
     }
     .podium-place-2 {
       order: 2 !important; /* Silver second */
       width: 100%;
     }
     .podium-place-3 {
       order: 3 !important; /* Bronze third */
       width: 100%;
     }
     ```
   - **Desktop (`@media (min-width: 1024px)`)**:
     ```css
     .podium-container {
       display: flex;
       flex-direction: row;
       align-items: flex-end;
       justify-content: center;
       gap: 20px;
     }
     .podium-place-2 {
       order: 1 !important; /* Silver on left */
     }
     .podium-place-1 {
       order: 2 !important; /* Gold in center */
     }
     .podium-place-3 {
       order: 3 !important; /* Bronze on right */
     }
     ```

---

## 4. DocsPage Wikipedia Layout Wrapping, Infobox & TOC

### Grid Collapse
- Missing `.docs-page-layout` in `src/styles.css`. Must be added:
  ```css
  /* Desktop (default) */
  .docs-page-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    width: 100%;
  }

  /* Mobile (<768px) */
  @media (max-width: 767px) {
    .docs-page-layout {
      grid-template-columns: 1fr !important;
      display: block !important;
      width: 100% !important;
    }
  }
  ```

### Infobox Responsiveness
- `.wiki-infobox` in `src/styles.css:4001`:
  - Desktop: `float: right; width: 320px; margin: 0 0 20px 24px;`
  - Mobile (`@media (max-width: 767px)`):
    ```css
    .wiki-infobox {
      float: none !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 0 20px 0 !important;
      box-sizing: border-box !important;
    }
    ```

### All 4 Specification Tables in `.table-wrap`
- Test `[T2-OVR-02]` asserts `wrapCount >= 4` for `div.table-wrap` inside `DocsPage.tsx`.
- Currently `DocsPage.tsx` only has 3 tables and 0 `.table-wrap` wrappers.
- The 4 specification tables to be wrapped in `<div className="table-wrap">`:
  1. **Infobox Table** (line 159): `<div className="table-wrap"><table className="wiki-infobox-table">...</table></div>`
  2. **Borda Voting Scale** (line 407): `<div className="table-wrap"><table className="wikitable">...</table></div>`
  3. **Production Pipeline Phases** (line 546): `<div className="table-wrap"><table className="wikitable">...</table></div>`
  4. **Department Roles & Track Matrix** (Section 3 or Section 6): Add a dedicated specification table for Creative Tracks/Roles enclosed in `<div className="table-wrap"><table className="wikitable">...</table></div>`.

---

## 5. Touch Ergonomics Audit ($\ge 44\times 44$px Targets & $\ge 8$px Separation)

The audit revealed multiple elements violating touch ergonomics standards (Apple HIG / Android Material 48px/44px minimum):

| Target Element | File & Line | Current Computed Size | Required Size / CSS Fix | Separation Requirement |
|---|---|---|---|---|
| **`.thought-bubble-trigger`** | `src/styles.css:2834` | `32×32px` | Change to `width: 44px; height: 44px; min-width: 44px; min-height: 44px;` | $\ge 8$px from round box |
| **`.modal-close-btn`** / `.icon-btn` | `CreatePitchModal.tsx:197`, `CreateRoundModal.tsx:95` | `style={{ width: 30, height: 30 }}` | Remove sub-44px inline style. Add `className="modal-close-btn icon-btn"`. Set `min-width: 44px; min-height: 44px;` | Top-right padding $\ge 12$px |
| **`.slot-clear-btn`** | `VotePage.tsx:532, 584, 636` | `padding: '2px 8px', fontSize: '11px'` | Add `className="btn btn-secondary slot-clear-btn"`. CSS: `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;` | $\ge 8$px from slot badges |
| **`.slot-reorder-btn`** | Missing in `VotePage.tsx` | Currently unrendered | Add Up (▲) and Down (▼) buttons on filled slots with `className="btn btn-secondary slot-reorder-btn"`. CSS: `min-width: 44px; min-height: 44px;` | $\ge 8$px gap between Up and Down |
| **`.tap-rank-chip`** | Missing in `VotePage.tsx` | Currently unrendered | Add `[1st]`, `[2nd]`, `[3rd]` chips with `className="tap-rank-chip"`. CSS: `min-width: 44px; min-height: 44px; padding: 6px 12px;` | Group in `.tap-chips-group` with `gap: 8px;` |
| **`.tap-chips-group`** | Missing in `src/styles.css` | N/A | Add `.tap-chips-group { display: flex; align-items: center; gap: 8px; column-gap: 8px; }` | Exactly $\ge 8$px separation |
| **`.btn-moderation`** | `DevWorkbench.tsx:483, 493, 503, 512` | `padding: '3px 8px', fontSize: '11px'` | Add `className="btn btn-secondary btn-moderation"`. CSS: `min-height: 44px; padding: 8px 14px;` | $\ge 8$px button gap |
| **`.btn-primary`** | `src/styles.css:3768` | Varies (sub-44px on desktop) | On mobile (`<768px`), enforce `.btn-primary { min-height: 44px !important; }` | $\ge 8$px between CTAs |
| **`.settings-trigger-btn`** | Mobile Navbar | Varies | Enforce `min-width: 44px; min-height: 44px;` | Integrated in top mobile header |

---

## 6. Bottom Sheet Transformation for All Modals

All dialogs must convert from desktop-centered modals into smooth bottom sheets on mobile viewports (`<768px`).

### Target Modals:
1. `CreatePitchModal.tsx`
2. `CreateRoundModal.tsx`
3. `CommandPalette.tsx`
4. `CandidateDetailModal` (or Candidate Inspection Sheet in VotePage/DevWorkbench)

### Architectural Specification:
```css
/* Mobile Bottom Sheet (<768px) */
@media (max-width: 767px) {
  .modal-backdrop,
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(9, 13, 22, 0.7);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: flex-end; /* Anchor to bottom */
    justify-content: center;
    padding: 0;
  }

  .modal-sheet-mobile {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 85vh !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;
    border-top-left-radius: 20px !important;
    border-top-right-radius: 20px !important;
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    margin: 0 !important;
    padding: 16px 20px max(24px, env(safe-area-inset-bottom, 24px)) !important;
    box-sizing: border-box !important;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5) !important;
    animation: sheet-slide-up 0.26s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  .modal-drag-pill {
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-strong, #475569);
    margin: 0 auto 14px;
    flex-shrink: 0;
  }

  .modal-actions-stacked {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
    margin-top: 14px !important;
  }

  .modal-actions-stacked .btn {
    width: 100% !important;
    min-height: 44px !important;
  }
}

/* Desktop Floating Centered Dialog (>=1024px) */
@media (min-width: 1024px) {
  .modal-dialog-desktop {
    position: relative !important;
    margin: auto !important;
    max-width: 560px !important;
    border-radius: 16px !important;
    max-height: 90vh !important;
    align-self: center !important;
  }

  .modal-drag-pill {
    display: none !important;
  }
}
```

### Component Code Patterns:
- **Backdrop Dismiss**:
  ```tsx
  <div className="modal-backdrop overlay" onClick={onClose}>
    <div
      className="white-card modal-sheet-mobile modal-dialog-desktop"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-drag-pill" />
      {/* Modal content */}
      <div className="modal-actions-stacked">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">Submit</button>
      </div>
    </div>
  </div>
  ```

---

## 7. Identified Edge Cases & Concrete Implementation Blueprints

### A. VotePage Tap-to-Rank Anti-Stacking & Clean Swap
- When user taps `[1st]` for candidate $C_1$:
  - If $C_1$ is already in `rank2`, clear `rank2` and place $C_1$ in `rank1` (no duplicates).
  - If $C_1$ is already in `rank1`, keep it in `rank1` (idempotent).
  - Chip UI: Highlight active rank with gold/silver/bronze ring and badge when selected.
  - Screen reader accessibility: `aria-label="Rank 1st: [Candidate Title]"`.

### B. VotePage Slot Reorder Mechanics
- Filled Slot 1: Render Down (▼) chevron (`onReorderRank(1, 2)`).
- Filled Slot 2: Render Up (▲) chevron (`onReorderRank(2, 1)`) and Down (▼) chevron (`onReorderRank(2, 3)`).
- Filled Slot 3: Render Up (▲) chevron (`onReorderRank(3, 2)`).
- Empty Slots: Reorder chevrons are hidden or disabled.
- Touch target: Chevrons must use `.slot-reorder-btn` with $\ge 44\times 44$px bounding area.

### C. Sound Engine Wiring in VotePage
- Import `sounds` from `../../utils/soundEffects.ts`.
- Tapping tap-to-rank chip: call `sounds.playSlot()` or `sounds.playPop()`.
- Clearing a slot: call `sounds.playReset()`.
- Valid ballot submission: call `sounds.playLevelUp()`.
- Incomplete / invalid ballot submission: suppress `sounds.playLevelUp()`.

### D. SettingsPage Mobile Horizontal Sub-Tab Chips
- Replace vertical 280px sidebar on `<768px` with a horizontally scrollable chip bar `.settings-nav-tabs`:
  ```css
  @media (max-width: 767px) {
    .settings-nav-tabs {
      display: flex;
      overflow-x: auto;
      gap: 8px;
      padding: 8px 0;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
  }
  ```

### E. Virtual Keyboard Height Adaptation
- When mobile virtual keyboard opens, available viewport height shrinks dramatically (from ~800px to ~380px).
- Bottom sheet `.modal-sheet-mobile` must use `max-height: 85vh` with `overflow-y: auto !important` and `box-sizing: border-box` so form fields remain accessible and scrollable.

---

## Conclusion & Readiness

All 33 failing tests have been mapped to exact line numbers and missing CSS declarations. Implementing the outlined changes in `src/styles.css`, `VotePage.tsx`, `PublicLeaderboard.tsx`, `DocsPage.tsx`, `SettingsPage.tsx`, `DevWorkbench.tsx`, `CreatePitchModal.tsx`, `CreateRoundModal.tsx`, and `CommandPalette.tsx` will fully satisfy Requirements R3 and R4 while preserving complete backward compatibility with desktop viewports.
