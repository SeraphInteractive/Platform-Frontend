# Handoff Report: Modals & Secondary Pages Survey

**Explorer**: Survey Explorer 3  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_3`  
**Handoff Type**: Hard (Investigation Complete)  
**Primary Artifact**: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_survey_3/survey_report.md`  

---

## 1. Observation

Direct observations from source inspection and build diagnostics:

1. **`CreatePitchModal.tsx` (`src/components/CreatePitchModal.tsx`)**:
   - Lines 160-185: Inline styling defines a fixed desktop-centered card:
     ```tsx
     <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(9, 13, 22, 0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
       <div className="white-card" style={{ maxWidth: 560, width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
     ```
   - Line 197: Close button hit box is explicitly 30×30px: `<button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onClose} ...>`
   - Line 325: Remove media button is `<button type="button" className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={handleRemoveMedia}>` (height ~20px).
   - Lines 289-303: Character counter header has `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>` with long string `{wordCount} / 256 words ({charCount}/{MAX_CHAR_LIMIT} chars)`.
   - Lines 381-413: Action buttons are in a flex-end row without vertical stacking for mobile screens.

2. **`SettingsDropdown.tsx` (`src/components/SettingsDropdown.tsx` & `src/styles.css:641-647, 802-816`)**:
   - `styles.css` lines 641-647:
     ```css
     .right-nav-rail .account-overview-popover,
     .left-nav-rail .account-overview-popover {
       top: auto;
       bottom: 0;
       right: calc(100% + 14px);
       left: auto;
     }
     ```
     When docked on the left rail (`left: 0`), `right: calc(100% + 14px)` positions the 300px popover entirely off-screen to the left (negative X coordinates).
   - `styles.css` line 806: `width: 300px;`. On a 320px viewport, this consumes 93.8% of screen width with zero margin safety.
   - `SettingsDropdown.tsx` line 38: Uses `icon-btn-sm` (28×28px).
   - `SettingsDropdown.tsx` line 104: Theme toggle has `style={{ fontSize: '11px', padding: '2px 8px' }}` (~20px high).

3. **`DocsPage.tsx` (`src/views/Docs/DocsPage.tsx`)**:
   - Line 120: Hardcoded inline style:
     ```tsx
     <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start', marginBottom: 28 }}>
     ```
     Fixed 300px column side-by-side with 1fr text forces minimum width >428px.
   - Lines 283, 329, 469, 612: All 4 major tables (`Tracks`, `Terminology`, `Pipeline`, `Security`) are bare `<table className="clean-table">` elements **not wrapped** in `.table-wrap` or any overflow container. Column widths range from 450px to 650px minimum, blowing out the horizontal viewport on mobile.
   - Line 206: Table of contents container has `minWidth: 280`, overflowing a 320px screen with 48px padding (224px available).

4. **`SettingsPage.tsx` (`src/views/Settings/SettingsPage.tsx` & `src/styles.css:1672-1677`)**:
   - `styles.css` lines 1672-1677:
     ```css
     .settings-page-layout {
       display: grid;
       grid-template-columns: 280px 1fr;
       gap: 28px;
       margin-top: 8px;
     }
     ```
     No media query exists for `.settings-page-layout` in the entire 3,104-line stylesheet.

5. **`PublicLeaderboard.tsx` (`src/views/VoterApp/PublicLeaderboard.tsx` & `src/styles.css:2542-2548`)**:
   - `styles.css` lines 2542-2548:
     ```css
     @media (max-width: 680px) {
       .podium-container {
         flex-direction: column;
         align-items: stretch;
         gap: 12px;
       }
     }
     ```
   - In `PublicLeaderboard.tsx`, top2 (Silver) has `style={{ order: 1 }}`, top1 (Gold) has `style={{ order: 2 }}`, and top3 (Bronze) has `style={{ order: 3 }}`. In mobile column mode, **2nd place renders above 1st place**.
   - Lines 107, 139, 172: Pillars have min-heights of 180px, 140px, 110px. In vertical stack, they add ~500px of dead space.
   - Lines 194-203: 5-column standings table has min-width ~730px with hidden scrollbars.

6. **`DevWorkbench.tsx` & Sub-Views (`src/views/DevWorkbench/`)**:
   - Moderation Table (lines 384-395): 6 columns with min-widths 260px, 140px, 160px, 130px, 130px, 160px = 980px total min-width.
   - Moderation Actions (lines 472-520): 5 buttons (`Inspect`, `Approve`, `Flag`, `Reject`, `×`) packed in one table cell with `padding: '3px 8px', fontSize: '11px'` (height ~22px).
   - Network Table (`NetworkTelemetryChart.tsx:981-1013`): 8 columns with min-width 1140px.
   - `DevWorkbench.tsx:720-887`: Internal pitch inspection modal is a desktop-centered card with 4 crowded footer buttons and a 30×30px close button.
   - `RaidTelemetryChart.tsx:472-529`: Inspection modal has hardcoded `color: '#f8fafc'` on title line 476, causing invisible text in light mode.

7. **`ProgressPage.tsx` (`src/views/Progress/ProgressPage.tsx`)**:
   - Line 374: `style={{ display: 'grid', gridTemplateColumns: '3fr 4fr 5fr 5fr', gap: 8 }}` forces 4 columns on all screen sizes.
   - Line 425: Timeline track forces 17 circular milestone nodes (`width: 26, height: 26`) into ~208px available width on 320px screen, causing dense node overlap.
   - Lines 855-1040: Post-update modal contains multiple 3-column input grids (`1fr 1fr 1fr` and `2fr 1fr 1fr`).

8. **Touch Targets across Interactive Elements**:
   - All modal close buttons use 30×30px or 28×28px (`icon-btn-sm`).
   - `.btn-sm` (height ~30px), table action buttons (height ~22px), pagination buttons (height ~24px), time span toggles (~20px), and theme toggle (~20px) all violate the 44×44px touch target guideline.

9. **Build Status**:
   - Command `npm run build` executes `tsc && vite build` and completes with 0 errors in 1.42s.

---

## 2. Logic Chain

1. *From Observation 1 & 8*: `CreatePitchModal` uses a centered desktop layout with a 30×30px close button, a 20px remove-media button, non-wrapping character counter, and non-stacking action buttons.  
   *Inference*: When viewed on a 320px-480px screen (especially with soft keyboard active), users cannot comfortably reach or tap controls, violating Requirement R2 ("Transform desktop-centered modals into smooth mobile bottom sheets/drawers on small viewports" and "44×44px touch target guidelines").

2. *From Observation 3*: `DocsPage` hardcodes a 300px infobox in an un-queried `1fr 300px` grid and embeds four 520px-650px wide tables without any scroll wrapper.  
   *Inference*: Because 1fr + 300px + gap exceeds 320px-480px, and tables exceed 520px without overflow wrapping, the entire Docs page forces unwanted horizontal scrollbars, violating Requirement R1 ("scale fluidly without horizontal scrollbars ... on screens from 320px to 768px").

3. *From Observation 4*: `styles.css` lines 1672-1677 configure `.settings-page-layout` as `grid-template-columns: 280px 1fr` with zero media queries.  
   *Inference*: On a 320px viewport, 280px + 28px gap leaves only 12px for content, completely crushing the settings content column and breaking page layout.

4. *From Observation 5*: `PublicLeaderboard` podium sets Silver (`order: 1`) and Gold (`order: 2`) in column mode under 680px, while empty pillars occupy ~500px of height.  
   *Inference*: On mobile, 2nd place renders above 1st place, confusing users, while empty vertical pillars waste two full screens of vertical scroll.

5. *From Observation 6*: `DevWorkbench` tables exceed 980px and 1140px, while action buttons are 22px high.  
   *Inference*: Staff members managing pitches or testing endpoints on tablets/phones face massive horizontal table scroll and high mis-tap risk between "Approve", "Flag", and "Reject".

6. *From Observation 7*: `ProgressPage` squeezes 17 nodes of 26px width (442px required) into a 208px mobile bar.  
   *Inference*: Nodes overlap completely, making individual milestone inspection impossible on touch devices.

7. *From Observation 9*: The project builds with zero TypeScript or Vite errors.  
   *Inference*: Responsive refactoring can be applied cleanly using CSS media queries and responsive JSX structures without breaking compilation integrity.

---

## 3. Caveats

- **Scope Boundary**: This survey strictly evaluated Modals and Secondary Pages (`PublicLeaderboard`, `Pitch Submissions`, `GrabBox`, `Guidelines`, `Privacy`, `Terms`, `Docs`, `DevWorkbench`, `SettingsPage`, `ProgressPage`). The primary Navbar and `VotePage` candidate card roller & 3-tier ranked ballot selector were surveyed by Explorers 1 & 2.
- **Backend Mock Data**: The survey was conducted against current local client mock and SQLite/PostgreSQL schema structures; all identified UI defects are layout and styling constraints in the React/CSS layers.
- No other caveats.

---

## 4. Conclusion

1. **Modals**: All application modals (`CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, `SettingsDropdown`, and secondary inspection sub-modals) must be converted into responsive bottom sheets on mobile viewports (`< 768px`) with top grab handles, 44×44px touch targets, full-width action buttons, and bottom anchoring. On desktop (`>= 768px`), centered floating modal layouts must be strictly preserved.
2. **Horizontal Blowouts**: The four major causes of horizontal scrollbars on secondary pages are:
   - `DocsPage.tsx`: inline `gridTemplateColumns: '1fr 300px'` and unwrapped specification tables.
   - `SettingsPage.tsx`: `.settings-page-layout` fixed 280px sidebar grid.
   - `DevWorkbench.tsx`: 980px and 1140px wide matrix tables.
   - `ProgressPage.tsx`: 4-phase grid and overlapping 17-node milestone track.
3. **PublicLeaderboard**: Podium ordering in column mode must be fixed (`order: 1` on Gold, `order: 2` on Silver, `order: 3` on Bronze), empty pillar height minimized on mobile, and the 730px table transformed into mobile touch cards on screens `< 640px`.
4. **Touch Targets**: All sub-44px buttons (`btn-sm`, `icon-btn-sm`, inline-styled buttons) must receive minimum 44×44px touch hit areas on mobile viewports.
5. **Light Mode Bug**: In `RaidTelemetryChart.tsx` line 476, replace hardcoded `#f8fafc` with `var(--text-main)` to fix white-on-white text in light mode.

---

## 5. Verification Method

1. **TypeScript Compilation & Build Verification**:
   ```bash
   cd /home/yierke/Documents/vote-ui
   npm run build
   ```
   *Expected result*: `tsc && vite build` terminates with exit code 0.

2. **Mobile Viewport Inspections (320px, 375px, 480px, 768px)**:
   - Run Vite preview or dev server: `npm run preview`
   - Open Chrome DevTools with responsive emulation set to:
     - 320px (e.g. iPhone SE 1st gen / narrow view)
     - 375px (iPhone SE 2nd / iPhone 13 mini)
     - 768px (iPad portrait)
     - 1024px and 1440px (Desktop baseline)
   - Verify `CreatePitchModal`: Opens as a smooth bottom sheet anchored to bottom on <=768px, with drag pill, 44px close button, stacked action buttons, and character counter cleanly stacked.
   - Verify `DocsPage`: No horizontal scrollbar at 320px; infobox stacks below lead text; tables are wrapped in `.table-wrap` and scroll smoothly without expanding the page.
   - Verify `SettingsPage`: At 320px - 768px, layout is 1 column; content is legible without horizontal overflow.
   - Verify `PublicLeaderboard`: At <680px, 1st place gold renders first, followed by 2nd place silver, then 3rd place bronze. Standings render as responsive cards or wrapped table.
   - Verify `RaidTelemetryChart`: Outlier modal title text is crisp and visible in both light and dark themes.
   - Verify `DevWorkbench`: Moderation and Network tables do not expand the viewport; action buttons are thumb-friendly (>=44px).

3. **Desktop Preservation Verification (>=1024px)**:
   - At 1024px and 1440px:
     - `CreatePitchModal` is centered floating dialog with backdrop blur.
     - `SettingsPage` retains 280px sidebar + 1fr content grid with sticky navigation.
     - `DocsPage` retains Wikipedia-style 1fr + 300px floating infobox.
     - `PublicLeaderboard` retains staggered 3D podium pillars.
     - `DevWorkbench` maintains dense high-fidelity telemetry graphs.
