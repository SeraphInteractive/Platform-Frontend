# Survey Report: Modals, Popups, and Secondary Pages (320px - 768px Audit)

**Date**: 2026-09-19  
**Target Project**: `vote-ui` (`/home/yierke/Documents/vote-ui`)  
**Surveyor**: Survey Explorer 3 (Modals & Secondary Pages Focus)  
**Scope**: Modals (`CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, `SettingsDropdown`, internal sub-modals) and Secondary Pages (`PublicLeaderboard`, `Pitch Submissions` / moderation views, `GrabBox`, `Guidelines`, `Privacy`, `Terms`, `Docs`, `DevWorkbench`, `SettingsPage`, `ProgressPage`).

---

## Executive Summary

A comprehensive forensic survey of all modals, popups, and secondary routes in `vote-ui` was conducted across viewport ranges from 320px to 768px (mobile/tablet) and >=1024px (desktop). 

While the desktop application renders with high fidelity, aesthetic polish, and rich data density, **mobile viewports (320px – 768px) exhibit severe responsiveness defects, horizontal scrollbar blowouts, touch target violations (<44px), and clunky centered modal interactions**. Specifically:
1. **Desktop-Centered Modals**: All 6 modals in the application (`CreatePitchModal`, `CreateRoundModal`, `CommandPalette`, `DevWorkbench` pitch inspector, `RaidTelemetryChart` entry inspector, and `ProgressPage` devlog update modal) are styled as fixed desktop-centered popups with small touch close buttons (30x30px), rigid padding, multi-column inputs, and no mobile bottom-sheet ergonomics.
2. **Account Popover Breakage**: `SettingsDropdown` is anchored with `right: calc(100% + 14px)` in the vertical nav rail (which renders it off-screen to the left under 0px X coordinate) and has a fixed width of 300px without viewport bounding.
3. **Severe Horizontal Blowouts on Secondary Pages**:
   - `DocsPage`: Hardcoded inline `display: grid; gridTemplateColumns: '1fr 300px'` crushes the lead section or blows out horizontally on all screens < 768px. Furthermore, **all 4 technical specification tables** (`Tracks`, `Terminology`, `Pipeline Roadmap`, and `Security Defense Vectors`) are bare `<table>` elements without `.table-wrap` or overflow containment, forcing the page width to >650px.
   - `SettingsPage`: `.settings-page-layout` has hardcoded `grid-template-columns: 280px 1fr` with **zero media queries**, placing a 280px sidebar beside the content and overflowing any viewport under 768px.
   - `PublicLeaderboard`: On mobile (<680px), the podium flex container collapses to column mode with `top2` at `order: 1` and `top1` at `order: 2`, causing **2nd place to render ABOVE 1st place**. The 5-column standings table has min-width ~730px and relies on hidden scrollbars.
   - `DevWorkbench`: The Moderation matrix table (6 columns, min-width 980px) and Network matrix table (8 columns, min-width 1140px) require massive horizontal scrolling while scrollbars are suppressed globally by `*::-webkit-scrollbar { display: none !important; }`.
   - `ProgressPage`: The timeline track forces 17 numbered circular nodes into a fixed bar; on a 320px screen, the nodes overlap and become impossible to tap. The post-update modal has 3-column input grids (`1fr 1fr 1fr` and `2fr 1fr 1fr`) that crush inputs.
4. **Touch Ergonomics**: Numerous interactive buttons across tables, pagination bars, and modal footers use `.btn-sm` (height ~30px), `.icon-btn-sm` (28x28px), or inline padding of `2px 8px` / `3px 8px`, falling far short of the 44×44px touch target guideline.
5. **Desktop Preservation**: Desktop views (>=1024px) are clean and dense. Mobile-first transformations must use media queries (`@media (max-width: 767px)`) or container queries to ensure zero visual or functional regressions on desktop and tablet.

---

## 1. Modals & Dialogs Audit & Bottom Sheet Conversion Plan

### 1.1 `CreatePitchModal.tsx` (`src/components/CreatePitchModal.tsx`)
- **Current Desktop Behavior**: Centered `white-card` dialog (lines 174-185) with `maxWidth: 560`, `padding: '28px'`, `maxHeight: '90vh'`, `borderRadius: var(--radius-xl)`.
- **Identified Mobile Issues (320px - 768px)**:
  - **Centered Framing**: On mobile devices (particularly with virtual software keyboards open), a centered modal consumes awkward vertical space and the top/bottom headers/actions are easily pushed off-screen.
  - **Close Button Touch Target**: Line 197 uses `style={{ width: 30, height: 30 }}`. Fails the 44x44px touch target standard.
  - **Character & Word Counter Overflow**: Lines 289-303 display the label `"Description (Max 256 Words)"` and character counter `"{wordCount} / 256 words ({charCount}/{MAX_CHAR_LIMIT} chars)"` in a single flex `space-between` row. On a 320px viewport with 28px card padding (available width: 264px), the counter wraps awkwardly and collides with the label.
  - **Media Upload Trigger**: Line 360 uses a large clickable box (`padding: '20px'`), which is good for tapping, but the `"Remove Media"` button (line 325) has `style={{ padding: '2px 8px', fontSize: '11px' }}` (~20px touch height), making it very difficult to hit on a touchscreen.
  - **Action Buttons Layout**: Lines 381-413 use `display: 'flex', justifyContent: 'flex-end', gap: 10`. On narrow screens, `"Log In with Discord to Submit"` (400px width text string) wraps awkwardly beside `"Cancel"`.
- **Mobile Bottom Sheet Conversion Architecture**:
  - For viewports `< 768px`:
    - Backdrop: `align-items: flex-end; padding: 0;` (anchored to bottom).
    - Sheet Container: `width: 100%; max-width: 100%; border-radius: 20px 20px 0 0; max-height: 88vh; padding: 20px 16px env(safe-area-inset-bottom, 16px) 16px;`.
    - Drag Handle: Add an accessible top pill grab handle (`width: 36px; height: 4px; border-radius: 2px; background: var(--border-strong); margin: 0 auto 12px;`).
    - Close Button: Increase hit area to `min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;`.
    - Character Counter: Stack counter beneath label on `< 480px` or shorten text to `"{wordCount}/256w ({charCount}/1500c)"`.
    - Action Buttons: `display: flex; flex-direction: column-reverse; gap: 10px; width: 100%;` with full-width buttons (`min-height: 44px; font-size: 14px;`).
    - Remove Media Button: Upgrade to minimum 44px touch target.
  - For viewports `>= 768px`: Retain existing desktop-centered card modal layout verbatim.

---

### 1.2 `CreateRoundModal.tsx` (`src/components/CreateRoundModal.tsx`)
- **Current Desktop Behavior**: Fixed centered modal (`maxWidth: 520`) with 20px padding backdrop.
- **Identified Mobile Issues**:
  - Close button: Line 95 has `style={{ width: 30, height: 30 }}` (<44px).
  - Multi-Column Grid: Line 127 uses `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}` for `"Category"` and `"Initial Status"`. On 320px-360px viewports, the two select dropdowns are squished to ~110px each, cutting off option labels like `"Active (Accepting Ballots)"`.
  - Buttons: Flex-end row with small touch targets.
- **Remediation**:
  - Convert to bottom sheet on `< 768px` with bottom anchoring and top pull handle.
  - Make `Category` and `Initial Status` grid collapse to `grid-template-columns: 1fr` on small screens.
  - Enlarge close button to 44x44px.
  - Action buttons stack vertically on mobile with 44px touch targets.

---

### 1.3 `CommandPalette.tsx` (`src/components/CommandPalette.tsx`)
- **Current Desktop Behavior**: Floating card modal positioned at `paddingTop: '12vh'` with `maxWidth: 620`.
- **Identified Mobile Issues**:
  - **Offset Collision**: `paddingTop: '12vh'` pushes the modal down. When the on-screen keyboard appears on mobile, the modal is pushed off-screen or the command list is hidden.
  - **No Touch Dismissal Control**: Line 170 displays `<kbd>ESC</kbd>` which is completely useless on mobile touch devices. Tapping the backdrop works, but lacks an explicit touch-friendly "Done" or "Cancel" button.
  - **Search Input Auto-Zoom Bug**: Line 165 has `fontSize: '15px'`. On iOS Mobile Safari, any input with font-size < 16px triggers automatic page zooming, breaking responsive layouts.
  - **Command List Items Touch Targets**: Line 206 uses `padding: '10px 14px'`, yielding an item height of ~36px (<44px minimum).
- **Remediation**:
  - On `< 768px`: Position at `top: 0; padding: 12px 12px 0 12px;` or convert to full-screen overlay with sticky header.
  - Set input `font-size: 16px` to prevent iOS zoom.
  - Add explicit "Done" / "Close" icon button (44x44px) next to input.
  - Increase item height to `min-height: 48px` with `padding: 12px 14px`.

---

### 1.4 `SettingsDropdown.tsx` (`src/components/SettingsDropdown.tsx`)
- **Current Desktop Behavior**: Positioned as `.account-overview-popover` (`position: absolute; top: 52px; right: 0; width: 300px;` or in rail: `bottom: 0; right: calc(100% + 14px);`).
- **Identified Mobile Issues**:
  - **Negative Coordinate Offscreen Bug**: In `styles.css` line 642, `.left-nav-rail .account-overview-popover` and `.right-nav-rail .account-overview-popover` have `right: calc(100% + 14px)`. On mobile viewports or whenever the rail is docked on the left, this projects the 300px popover to the left of 0px, hiding it off-screen!
  - **Fixed 300px Width**: On a 320px viewport, `width: 300px` leaves only 10px on each side. If offset even slightly, it creates horizontal page overflow.
  - **Sub-standard Touch Targets**:
    - Close button: Line 38 has `className="icon-btn-sm"` (28x28px in CSS line 2418).
    - Theme toggle: Line 104 has `style={{ fontSize: '11px', padding: '2px 8px' }}` (~20px high).
- **Remediation**:
  - On mobile (`< 768px`), display `SettingsDropdown` as a bottom sheet drawer or centered modal overlay with fixed backdrop, rather than an unconstrained floating popover.
  - Upgrade close button and theme toggle to 44px minimum hit targets.
  - Constrain width with `max-width: calc(100vw - 24px)`.

---

### 1.5 Sub-Modals in Secondary Pages
1. **`DevWorkbench` Pitch Inspector Modal** (`DevWorkbench.tsx:720-887`):
   - Desktop-centered `white-card` with `maxWidth: 580`.
   - Close button: 30x30px.
   - Footer action buttons: 4 buttons ("Delete Proposal", "Approve", "Flag", "Close") crowded into two flex clusters. On 320px-375px viewports, buttons collide and wrap into multiple lines.
   - Long entropy string: `"Entropy=... | Burstiness=..."` overflows badge bounds.
   - *Fix*: Transform to responsive bottom sheet on mobile, stack action buttons vertically with 44px touch targets.
2. **`RaidTelemetryChart` Outlier Inspector Modal** (`RaidTelemetryChart.tsx:472-529`):
   - Uses `.modal-overlay` and `.modal-content` (`maxWidth: 460`).
   - Close button is tiny: `padding: '3px 8px', fontSize: '10.5px'`.
   - **Severe Contrast Bug**: Line 476 has hardcoded `color: '#f8fafc'`. In light mode (`--bg-card` is white `#ffffff`), the title text is invisible white-on-white.
   - 3-column stats grid (`repeat(3, 1fr)`): On 320px screens, each column is only ~70px wide, causing numbers and labels to truncate.
   - *Fix*: Bottom sheet on mobile, fix title color to `var(--text-main)`, enlarge close button.
3. **`RolesManagementView` Add Custom Role Modal** (`RolesManagementView.tsx:620-700`):
   - Centered card (`maxWidth: 440`) with tight padding and sub-44px buttons.
   - *Fix*: Bottom sheet conversion on mobile.
4. **`ProgressPage` Post / Edit Numbered Update Modal** (`ProgressPage.tsx:855-1080`):
   - Centered modal with multiple nested 3-column grids:
     - `gridTemplateColumns: '1fr 1fr 1fr'` for Author Name, Role, Tag (line 896).
     - `gridTemplateColumns: '2fr 1fr 1fr'` for Round Title, Ballots, Points (line 965).
     - `gridTemplateColumns: '1fr 1fr 100px'` for Place, Creator, Points (lines 996, 1020).
   - On screens < 480px, these 3-column inputs are severely crushed.
   - *Fix*: Bottom sheet conversion, single-column stacked inputs on mobile (`grid-template-columns: 1fr`).

---

## 2. Secondary Pages Survey & Responsiveness Audit

### 2.1 `PublicLeaderboard.tsx` (`src/views/VoterApp/PublicLeaderboard.tsx`)
- **Header Banner**: Line 56 has inline `padding: '28px 36px'`. On 320px screen, 72px total horizontal padding leaves only 248px for the title, ballot badges, and "Cast Ballot" button.
- **Top 3 Podium Stacking Bug (`styles.css:2542-2548`)**:
  - When viewport is `< 680px`, `.podium-container` switches to `flex-direction: column; align-items: stretch;`.
  - In JSX lines 86, 118, 150:
    - Silver (2nd place) has `order: 1`
    - Gold (1st place) has `order: 2`
    - Bronze (3rd place) has `order: 3`
  - **Defect**: On mobile, **2nd place renders FIRST, above 1st place!**
  - **Excessive Pillar Heights**: `.podium-pillar-gold` has `min-height: 180px`, `.podium-pillar-silver` has `min-height: 140px`, and `.podium-pillar-bronze` has `min-height: 110px`. When stacked in a vertical column on mobile, these 3 empty pillars consume ~500px of pure dead space!
  - *Fix*: In mobile column mode, set `order: 1` on Gold (1st), `order: 2` on Silver (2nd), and `order: 3` on Bronze (3rd). Reduce pillar heights to compact headers or horizontal banner strips on mobile.
- **Standings Table (`clean-table`)**:
  - Table has 5 columns: Rank (70px), Proposal (media preview 44px + text), Creator (avatar + username), Score (140px), Action (120px). Total min-width ~730px.
  - Placed inside `.table-wrap` (`overflow-x: auto`), but since scrollbars are disabled globally by CSS, users receive no visual affordance that the table is scrollable.
  - On 320px-480px screens, horizontal swiping is clunky and cuts off scores/action buttons.
  - *Fix*: Implement a mobile card-view transformation (`@media (max-width: 640px)`) where each proposal becomes an ergonomic touch card displaying Rank badge, Proposal Title, Creator, Score, and full-width "Vote" button.
- **Pagination**: Lines 307-353 wrap into 3-4 awkward lines on 320px. Prev/Next buttons have 24px height (`padding: '4px 10px'`).
  - *Fix*: Provide 44px touch targets and full-width mobile pagination bar.

---

### 2.2 `Pitch Submissions` / Moderation Views
- **Where Pitches Are Displayed**:
  1. `DevWorkbench.tsx` (Pitches Tab): 6-column matrix table with min-width 980px and crowded action buttons.
  2. `SettingsPage.tsx` (`mini-pitch-item`): Clean simple list, but lacks thumbnail preview and metadata.
  3. `LandingPage.tsx` (`TrackShowcase`): Responsive track cards.
- **DevWorkbench Pitches Table Defect**:
  - Lines 388-393 define table column widths: Proposal (min 260px), Category (140px), Submitter (160px), AI Radar (130px), Status (130px), Actions (160px) = 980px minimum!
  - Actions column has 5 small buttons (`Inspect`, `Approve`, `Flag`, `Reject`, `×`) packed into a ~22px height row. On touchscreens, users are at high risk of pressing "Reject" or "×" when attempting to tap "Approve".
  - *Fix*: On mobile (`< 768px`), convert table rows into moderation pitch cards with an expand/inspect sheet and thumb-friendly action buttons.

---

### 2.3 `GrabBox` (`src/views/GrabBox/GrabBoxPage.tsx`)
- **Current Status**: Standalone placeholder view (43 lines).
- **Mobile Issues**:
  - Container has `style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px', width: '100%' }}`. `margin: '80px auto'` causes large unnecessary vertical gap on mobile.
  - Card has `padding: '48px 36px'`. On 320px screens, 72px padding leaves 248px.
  - "Proposals" button is `btn btn-secondary btn-sm` (height <44px).
- *Fix*: On mobile, set `margin: '24px auto'`, `padding: '24px 16px'` on card, and 44px height on action button.

---

### 2.4 Legal Pages: `GuidelinesPage.tsx`, `PrivacyPage.tsx`, `TermsPage.tsx`
- **Current Implementation**: All three pages share identical layout in `src/views/Legal/`.
- **Mobile Issues**:
  - Header banner: `padding: '28px 36px'`.
  - Main Document Card: Inline `style={{ padding: '40px 48px', background: 'var(--bg-card)', fontSize: '14px', lineHeight: 1.8 }}`.
  - **Severe Padding Bloat**: On a 320px viewport, `48px` left + `48px` right padding = **96px of dead margin**! The readable content area is compressed to only **224px**, causing each line of text to wrap every 4-5 words.
  - Footer Links (`Footer.tsx`): 4-column grid (`gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'`). Link buttons have `padding: 0` and are spaced by `gap: 10`, making accidental taps frequent.
- *Fix*: On `< 768px`, reduce card padding to `20px 16px` and banner padding to `18px 16px`. Increase footer link padding to provide 44px touch targets.

---

### 2.5 `DocsPage.tsx` (`src/views/Docs/DocsPage.tsx`)
- **Main Document Card**: `style={{ padding: '40px 48px' }}` (96px horizontal padding on 320px viewport).
- **Lead Section + Infobox Grid Blowout (Line 120)**:
  - Line 120 has inline style: `style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}`.
  - **Critical Defect**: A fixed 300px infobox side-by-side with text. On any screen under 768px, 1fr + 300px + 32px gap + 96px padding = **428px absolute minimum plus text**! This completely blows out horizontal scrolling across all mobile phones.
  - *Fix*: Collapse to single column (`gridTemplateColumns: '1fr'`) under 768px.
- **Table of Contents (Line 206)**:
  - Has `style={{ minWidth: 280 }}`. On a 320px screen with card padding (224px available), `minWidth: 280` extends 56px beyond the container!
  - *Fix*: Change to `minWidth: 'unset', width: '100%', maxWidth: 320`.
- **Four Large Unwrapped Specification Tables**:
  - Tracks Table (line 283): Track (160px), Supervisor (180px), Scope (flex). Min-width ~520px.
  - Terminology Table (line 329): Term (180px), Definition (flex). Min-width ~450px.
  - Pipeline Table (line 469): Phase (100px), Stage (160px), Supervisor (160px), Deliverable (flex). Min-width ~650px.
  - Security Table (line 612): Vector (180px), Engine (200px), Action (flex). Min-width ~620px.
  - **CRITICAL DEFECT**: None of these 4 tables are wrapped in a scroll container! They are raw `<table className="clean-table">` elements placed directly in `<section>`. On any viewport between 320px and 650px, **these tables force horizontal overflow of the entire Docs page**.
  - *Fix*: Wrap every table in `<div className="table-wrap">` (or `<div className="table-responsive">`) and style with smooth touch scrolling and subtle scroll indicators.
- **Mathematical Formula Blocks (Lines 385, 402, 420)**:
  - Single-line math formulas: `S_i = \sum_(k=1)^N ...` and `S_(i, regularized) = ( S_i + C * m ) / ...`.
  - In fixed mono containers without `overflow-x: auto`. On 320px viewports, long formulas clip or cause horizontal expansion.
  - *Fix*: Add `overflow-x: auto; -webkit-overflow-scrolling: touch; word-break: break-word;` to all formula containers.

---

### 2.6 `DevWorkbench.tsx` (`src/views/DevWorkbench/DevWorkbench.tsx`)
- **Console Navigation Tabs (Lines 226-270)**:
  - 5 buttons in a flex-wrap container with `gap: 8`. On mobile, `.btn-sm` (height ~30px) is below 44px.
  - *Fix*: Upgrade tab buttons to min 44px touch height with horizontal scrolling tab strip on mobile.
- **Round Switcher & Action Strip (Lines 285-328)**:
  - On mobile, the round selector, "Delete Round", "+ New Round", and "+ Submit Proposal" wrap into an untidy 4-level stack.
  - *Fix*: Reorganize into a clean 2x2 grid or stacked card on mobile.
- **Sub-View Charts Audit**:
  1. `SupervisorModerationChart`:
     - Stat strip: `gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))'`. On 320px (256px inner card width), 170px min width forces awkward single column or overflow.
     - 3-Column analysis panels (line 102): `minmax(280px, 1fr)`. 280px exceeds 256px available width on 320px!
  2. `MomentsVarianceChart`:
     - 2-Column panels (line 213): `minmax(300px, 1fr)`. 300px exceeds 256px available width on 320px!
  3. `RaidTelemetryChart`:
     - Contains Trajectory graph and outlier inspection modal. Time span toggle buttons are ~20px high.
  4. `NetworkTelemetryChart`:
     - 8-column table with min-width 1140px.
  5. `RolesManagementView`:
     - 5-column table with min-width 900px.
  - *Fix for all DevWorkbench sub-views*:
    - Change grid minmax thresholds to `minmax(min(100%, 260px), 1fr)` or use responsive container queries.
    - Ensure all wide matrix tables are wrapped in `.table-responsive` with explicit overflow containment and horizontal touch scrolling.
    - Upgrade all table row action buttons to 44px touch targets.

---

### 2.7 `SettingsPage.tsx` (`src/views/Settings/SettingsPage.tsx`)
- **Two-Column Desktop Architecture Blowout (`styles.css:1672-1677`)**:
  ```css
  .settings-page-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 28px;
    margin-top: 8px;
  }
  ```
  - **CRITICAL DEFECT**: There is NO media query for `.settings-page-layout` in the entire CSS file!
  - A 280px fixed sidebar is placed side-by-side with `1fr` main content. On a 320px screen: 280px + 28px gap = 308px, leaving only 12px for the entire settings content! On 375px (iPhone SE/13 mini), it leaves only 67px!
  - *Fix*: Add `@media (max-width: 900px)` (or `@media (max-width: 768px)`):
    ```css
    @media (max-width: 860px) {
      .settings-page-layout {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .settings-nav-card {
        display: none; /* or collapsible horizontal pill navigation */
      }
    }
    ```
- **Section Cards**: `padding: 32px;` in line 1705. On 320px screen, 64px padding leaves only 256px.
  - *Fix*: Reduce padding to `16px 14px` on `< 768px`.
- **Horizontal Navigation Bar for Mobile**: On mobile viewports, replace the desktop sticky sidebar with a horizontal scrolling sub-tab bar or drop-down section selector for fast jumping between Account, Appearance, Accessibility, Activity, and Rules.

---

### 2.8 `ProgressPage.tsx` (`src/views/Progress/ProgressPage.tsx`)
- **Phase Bar Grid (Line 374)**:
  - `style={{ display: 'grid', gridTemplateColumns: '3fr 4fr 5fr 5fr', gap: 8 }}`.
  - 4 columns side-by-side on mobile. On 320px, each column has ~50px width, causing phase titles and supervisor names to wrap into vertical ribbons.
  - *Fix*: Stack phases into a 2x2 grid or horizontal carousel on `< 640px`.
- **17-Node Milestone Slider Track (Line 425)**:
  - A single horizontal bar with 17 numbered circular nodes (`width: 26, height: 26`).
  - On a 320px screen (inner card width ~240px, track width ~208px), 17 nodes of 26px width require **442px** just to sit edge-to-edge!
  - Result: All 17 milestone circles collide, stack on top of each other, and become completely un-tappable on mobile touchscreens!
  - *Fix*: On `< 768px`, replace the dense 17-node slider with a step progress indicator showing current phase, active milestone name, and a paginated milestone list with prev/next buttons.
- **Update Cards**: Devlog cards are mostly responsive, but Winner Placement badges should stack vertically on narrow screens.

---

## 3. Global Horizontal Scroll & Viewport Risk Matrix (320px – 768px)

| Component / File | Specific Element / Selector | Risk Type | Viewport Breakpoint | Remediation Plan |
|---|---|---|---|---|
| `CreatePitchModal.tsx` | Centered `white-card`, close btn 30px, action row | Centered modal on mobile; sub-44px touch targets; counter wrap | < 768px | Convert to responsive bottom sheet drawer; 44px touch targets; stack action buttons |
| `CreateRoundModal.tsx` | 2-column grid (`1fr 1fr`), close btn 30px | Squished selects; option truncation; sub-44px target | < 480px | Bottom sheet drawer; collapse to 1-column stack; 44px close target |
| `CommandPalette.tsx` | `paddingTop: '12vh'`, input `fontSize: '15px'` | Pushed offscreen by keyboard; iOS Safari auto-zoom; item height ~36px | < 768px | Anchor to top with safe padding; set input to 16px; min 44px row items |
| `SettingsDropdown.tsx` | `.account-overview-popover` (`width: 300px`, `right: calc(100% + 14px)`) | Negative coordinate offscreen bug; fixed 300px overflows 320px screen | < 768px | Convert to mobile drawer or centered modal; clamp width; 44px touch targets |
| `DocsPage.tsx:120` | `gridTemplateColumns: '1fr 300px'` | Fixed 300px infobox forces horizontal overflow | < 768px | Collapse grid to `grid-template-columns: 1fr` |
| `DocsPage.tsx:283-612` | 4 raw `<table>` elements without `.table-wrap` | Massive horizontal blowout (520px - 650px) | 320px - 768px | Wrap all tables in `.table-wrap` with horizontal touch scrolling |
| `DocsPage.tsx:206` | Table of contents `minWidth: 280` | Overflows 224px available width on 320px screen | < 360px | Remove fixed minWidth; use `width: 100%; max-width: 280px;` |
| `SettingsPage.tsx` | `.settings-page-layout` (`grid-template-columns: 280px 1fr`) | Fixed 280px sidebar side-by-side crushes content | < 860px | Add media query to collapse layout to `1fr`; add mobile tab switcher |
| `PublicLeaderboard.tsx` | Podium column stack (`order: 1` on 2nd, `order: 2` on 1st) | Inverted placement hierarchy (2nd above 1st); 500px dead pillar space | < 680px | Fix visual ordering (1st on top, then 2nd, 3rd); reduce mobile pillar height |
| `PublicLeaderboard.tsx` | Standings `clean-table` (min-width ~730px) | Horizontal table scroll with hidden scrollbars | < 640px | Transform into mobile touch cards for proposals |
| `DevWorkbench.tsx` | Moderation matrix (980px) & Network matrix (1140px) | Massive table overflow; action buttons ~22px height (<44px) | 320px - 768px | Wrap in `.table-responsive`; convert to mobile cards; min 44px action buttons |
| `DevWorkbench.tsx:720` | Pitch inspection modal action buttons | 4 crowded buttons in footer collide on mobile | < 480px | Bottom sheet drawer; full-width stacked action buttons |
| `RaidTelemetryChart.tsx` | Outlier modal title `color: '#f8fafc'` | Invisible white text on white card in light mode | All viewports | Replace hardcoded color with `var(--text-main)` |
| `ProgressPage.tsx:374` | `gridTemplateColumns: '3fr 4fr 5fr 5fr'` | 4 narrow ribbons on mobile | < 640px | Stack into 2x2 grid or horizontal scroll track |
| `ProgressPage.tsx:425` | 17 milestone circles along 208px track | Complete node overlap; impossible to tap on touch | < 768px | Mobile step indicator showing active milestone and prev/next controls |
| `Legal/*` (`Guidelines`, `Privacy`, `Terms`) | Card `padding: '40px 48px'` | 96px dead margin leaves only 224px text width on 320px | < 768px | Reduce padding to `20px 16px` on mobile |

---

## 4. Touch Target Audit (<44px Guidelines)

The W3C WCAG 2.5.5 guideline and Apple/Google Human Interface Guidelines require a minimum touch target size of **44×44px** (or 48×48px) for mobile interactive controls.

### Specific Violations Identified:
1. **Modal Close Buttons**:
   - `CreatePitchModal.tsx:197`: `width: 30, height: 30` (30×30px) — **FAIL**
   - `CreateRoundModal.tsx:95`: `width: 30, height: 30` (30×30px) — **FAIL**
   - `DevWorkbench.tsx:757`: `width: 30, height: 30` (30×30px) — **FAIL**
   - `SettingsDropdown.tsx:38`: `className="icon-btn-sm"` (28×28px) — **FAIL**
   - `ProgressPage.tsx:863`: `.btn-sm` (30×30px) — **FAIL**
   - `RaidTelemetryChart.tsx:479`: `padding: '3px 8px', fontSize: '10.5px'` (~22px height) — **FAIL**
2. **Table Action Buttons**:
   - `PublicLeaderboard.tsx:290`: `.btn-sm` "Vote" button (height ~30px) — **FAIL**
   - `DevWorkbench.tsx:474-518`: "Inspect", "Approve", "Flag", "Reject", "×" (`padding: '3px 8px', fontSize: '11px'`, height ~22px) — **FAIL** (Severe mis-tap hazard)
   - `NetworkTelemetryChart.tsx:1150`: Test ping icon button (height ~24px) — **FAIL**
3. **Form Controls & Triggers**:
   - `CreatePitchModal.tsx:325`: "Remove Media" button (`padding: '2px 8px', fontSize: '11px'`, height ~20px) — **FAIL**
   - `SettingsDropdown.tsx:104`: "Theme Toggle" button (`padding: '2px 8px', fontSize: '11px'`, height ~20px) — **FAIL**
   - `DevWorkbench.tsx:349`: Filter pill buttons (`padding: '4px 10px', fontSize: '11px'`, height ~26px) — **FAIL**
   - `TrajectoryCoordinateGraph.tsx:255`: Time span toggle buttons (`padding: '2px 8px', fontSize: '10.5px'`, height ~20px) — **FAIL**
4. **Pagination Controls**:
   - `PublicLeaderboard.tsx:334`: Prev / Next buttons (`padding: '4px 10px', fontSize: '11px'`, height ~24px) — **FAIL**
   - `DevWorkbench.tsx:557`: Prev / Next buttons (`padding: '4px 10px', fontSize: '11px'`, height ~24px) — **FAIL**
5. **Milestone Nodes**:
   - `ProgressPage.tsx:471`: Circular node buttons (`width: 26, height: 26`) — **FAIL**

---

## 5. Desktop Preservation Strategy (>=1024px)

Per Requirement R3 ("Desktop Preservation & Build Integrity"), desktop and tablet form factors must retain full fidelity, charts, and information density without regressions.

### Preservation Rules:
1. **Modal Layouts on Desktop**:
   - At `>= 768px` (and especially `>= 1024px`), `CreatePitchModal`, `CreateRoundModal`, and `CommandPalette` MUST remain floating, centered cards with backdrop blur, centered vertical alignment, and max-widths of 520px - 640px.
   - The bottom-sheet drawer styling (`align-items: flex-end; border-radius: 20px 20px 0 0`) must ONLY activate at `@media (max-width: 767px)`.
2. **Settings Page Desktop Layout**:
   - At `>= 860px` (or `>= 1024px`), `.settings-page-layout` must retain `grid-template-columns: 280px 1fr; gap: 28px;` and sticky navigation sidebar verbatim.
3. **Docs Page Infobox Desktop Layout**:
   - At `>= 768px`, the Wikipedia-style two-column lead section with `gridTemplateColumns: '1fr 300px'` must remain intact, displaying the technical encyclopedia summary on the right.
4. **DevWorkbench Matrices on Desktop**:
   - Dense telemetry tables, Moments Gaussian bell curve, and Supervisor queue charts must preserve full desktop data density, hover states, and tooltips at `>= 1024px`.
5. **Leaderboard Podium on Desktop**:
   - At `>= 680px`, the 3D podium layout must maintain its staggered heights (1st gold in center/top, 2nd silver on left, 3rd bronze on right) with 3D pillar graphics.

---

## 6. Implementation Action Plan & Checklist

The findings from this survey provide concrete blueprints for implementation:

### Phase 1: CSS Foundations & Global Breakpoints
- [ ] Add clean mobile breakpoints in `styles.css` (`@media (max-width: 767px)` and `@media (max-width: 480px)`).
- [ ] Add reusable bottom-sheet classes: `.modal-bottom-sheet`, `.bottom-sheet-content`, `.sheet-drag-handle`.
- [ ] Add `.table-wrap` enhancements: smooth touch scrolling (`-webkit-overflow-scrolling: touch`), subtle scroll fade indicators.
- [ ] Define touch target minimum rule: all buttons on mobile have `min-height: 44px; min-width: 44px;`.

### Phase 2: Modals & Popups Modernization
- [ ] Convert `CreatePitchModal.tsx` into responsive bottom sheet on `< 768px` with top drag pill, 44px close button, stacked action buttons, and touch-friendly media upload controls.
- [ ] Convert `CreateRoundModal.tsx` into bottom sheet with 1-column input stack on mobile.
- [ ] Upgrade `CommandPalette.tsx` for mobile: top-aligned without 12vh gap, 16px search input (prevents iOS zoom), 44px close button and items.
- [ ] Fix `SettingsDropdown.tsx`: clamp width, fix negative left-rail offset, convert to mobile modal/drawer.
- [ ] Modernize sub-modals in `DevWorkbench`, `RaidTelemetryChart`, `RolesManagementView`, and `ProgressPage`.
- [ ] Fix light-theme contrast bug in `RaidTelemetryChart.tsx` modal title.

### Phase 3: Secondary Pages Responsiveness
- [ ] `PublicLeaderboard.tsx`: Fix mobile podium order (Gold 1st, Silver 2nd, Bronze 3rd), reduce pillar height bloat, transform table into mobile cards on `< 640px`.
- [ ] `DocsPage.tsx`: Collapse lead infobox grid on `< 768px`, wrap all 4 tables in `.table-wrap`, fix TOC min-width, make math formulas scrollable.
- [ ] `SettingsPage.tsx`: Add `@media (max-width: 860px)` to collapse `.settings-page-layout` to 1 column, add mobile sub-tab selector, reduce section card padding.
- [ ] `DevWorkbench.tsx`: Wrap all wide matrix tables, adjust chart minmax grids to `minmax(min(100%, 260px), 1fr)`, enlarge action buttons.
- [ ] `ProgressPage.tsx`: Stack 4-phase grid, replace 17-node overlapping slider with mobile step tracker, stack modal inputs.
- [ ] `Legal Pages` (`Guidelines`, `Privacy`, `Terms`): Reduce card padding from 48px to 16px on mobile, enlarge footer links.

### Phase 4: Quality & Verification
- [ ] Verify `npm run build` completes with 0 errors.
- [ ] Verify `npm run typecheck` (tsc) completes with 0 errors.
- [ ] Test all routes at 320px, 375px, 480px, 768px, and 1440px to confirm zero horizontal scrolling and complete desktop fidelity preservation.
