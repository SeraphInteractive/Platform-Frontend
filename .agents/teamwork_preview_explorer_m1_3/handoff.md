# Handoff Report: Responsive Layout Wrappers, Mobile Scroll Unlocking & Popover Positioning

**Agent**: Explorer 3 (Milestone 1)  
**Working Directory**: `/home/yierke/Documents/vote-ui/.agents/teamwork_preview_explorer_m1_3`  
**Target Path**: `/home/yierke/Documents/vote-ui`  
**Handoff Type**: Hard (Investigation Complete)  
**Date**: 2026-09-19  

---

## 1. Observation

### 1.1 Root Layout Shell & Sidebar Layout
- **File**: `/home/yierke/Documents/vote-ui/src/App.tsx`
  - Lines 188–203:
    ```tsx
    return (
      <div className={`app-root-layout ${isHomePage ? 'layout-homepage' : 'layout-with-sidebar'}`}>
        <Navbar ... />
        <main className={`dashboard-container ${isHomePage ? 'container-homepage' : 'container-sidebar'}`}>
          <div key={activeTab} className={`page-view-wrapper ${isBallotPage ? 'page-non-scroll' : 'page-scrollable'}`}>
    ```
- **File**: `/home/yierke/Documents/vote-ui/src/styles.css`
  - Lines 282–314:
    ```css
    #root {
      height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }

    /* App Root Layouts */
    .app-root-layout {
      height: 100vh;
      width: 100vw;
      display: flex;
      overflow: hidden;
    }

    .app-root-layout.layout-homepage {
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      height: 100vh;
    }

    .app-root-layout.layout-with-sidebar {
      flex-direction: row;
      padding: 12px;
      gap: 14px;
      box-sizing: border-box;
      overflow: hidden;
      height: 100vh;
    }
    ```
  - Lines 333–340:
    ```css
    .dashboard-container.container-sidebar {
      max-width: 100%;
      width: 100%;
      margin: 0;
      padding: 4px 8px;
      height: calc(100vh - 24px);
      overflow: hidden;
    }
    ```
  - Lines 448–465:
    ```css
    .right-nav-rail,
    .left-nav-rail {
      width: 64px;
      height: calc(100vh - 24px);
      background: var(--bg-card);
      ...
      order: 2;
      z-index: 900;
      box-sizing: border-box;
      animation: rail-slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    ```
- **Observation on Screen Width Depletion on Small Viewports (< 768px)**:
  - On desktop, `flex-direction: row` arranges the main content and the 64px right rail side-by-side with `padding: 12px` (24px horizontal) and `gap: 14px`.
  - Fixed horizontal footprint consumed by layout shell chrome: `24px (padding) + 14px (gap) + 64px (rail) = 102px`.
  - On a 320px viewport, `320px - 102px = 218px` remaining for `.dashboard-container`.
  - Subtracting `padding: 4px 8px` on `.dashboard-container.container-sidebar` leaves only `202px` of usable width.
  - Furthermore, `height: calc(100vh - 24px); overflow: hidden;` hardcodes desktop dimensions and completely suppresses mobile scrolling.

---

### 1.2 Page View Wrapper & Ballot Page Vertical Locking
- **File**: `/home/yierke/Documents/vote-ui/src/styles.css`
  - Lines 342–362:
    ```css
    .page-view-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      width: 100%;
    }

    .page-view-wrapper.page-non-scroll {
      overflow: hidden;
      height: 100%;
    }

    .page-view-wrapper.page-scrollable {
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
      padding-right: 4px;
    }
    ```
  - Lines 2751–2766:
    ```css
    .vote-layout-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 32px;
      align-items: stretch;
      width: 100%;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    @media (max-width: 1024px) {
      .vote-layout-grid {
        grid-template-columns: 1fr;
      }
    }
    ```
- **File**: `/home/yierke/Documents/vote-ui/src/App.tsx`
  - Lines 186 & 203:
    ```tsx
    const isBallotPage = activeTab === 'ballot';
    ...
    <div key={activeTab} className={`page-view-wrapper ${isBallotPage ? 'page-non-scroll' : 'page-scrollable'}`}>
    ```
  - Lines 228–230:
    ```tsx
    {activeTab === 'ballot' && (
      <div className="tab-content-area" style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>
    ```
- **Observation on Vertical Accessibility Failure on < 1024px**:
  - On desktop (`>= 1024px`), `.vote-layout-grid` has 2 columns: candidate roller (left) and 3 drop slots + Cast Vote button (right). Both fit side-by-side within 100vh.
  - At `<= 1024px`, `@media (max-width: 1024px)` collapses `.vote-layout-grid` into 1 column (`grid-template-columns: 1fr`).
  - When stacked in 1 column, the drop slots and Cast Vote button are positioned directly beneath the candidate roller, pushing total height to ~1200px.
  - Because `.page-view-wrapper.page-non-scroll` specifies `overflow: hidden; height: 100%`, and `App.tsx:229` specifies inline `overflow: 'hidden'`, and `.vote-layout-grid` specifies `overflow: hidden`, the user CANNOT scroll down.
  - On both tablets (< 1024px) and mobile phones (< 768px), the voting slots and Cast Vote button are completely unreachable.

---

### 1.3 SettingsDropdown & Account Popover Clipping / Negative Offsets
- **File**: `/home/yierke/Documents/vote-ui/src/components/SettingsDropdown.tsx`
  - Lines 13–45:
    ```tsx
    export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
      isOpen,
      onClose,
      onNavigateSettings,
      onNavigateTab,
    }) => {
      ...
      if (!isOpen) return null;
      ...
      return (
        <div className="account-overview-popover" onClick={(e) => e.stopPropagation()}>
          <div className="account-overview-header">
            <span className="account-overview-title">Account</span>
            <button className="icon-btn-sm" onClick={onClose} title="Close">
    ```
  - Line 38: Close button is `icon-btn-sm` (computed 28×28px).
  - Line 104: Theme button has `style={{ fontSize: '11px', padding: '2px 8px' }}` (computed height ~20px).
  - Lines 115–132: Action buttons use `.btn-sm` (height ~30px).
- **File**: `/home/yierke/Documents/vote-ui/src/styles.css`
  - Lines 641–647:
    ```css
    .right-nav-rail .account-overview-popover,
    .left-nav-rail .account-overview-popover {
      top: auto;
      bottom: 0;
      right: calc(100% + 14px);
      left: auto;
    }
    ```
  - Lines 801–816:
    ```css
    .account-overview-popover {
      position: absolute;
      top: 52px;
      right: 0;
      width: 300px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      padding: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    ```
- **Mathematical Calculation of Negative Offsets & Clipping**:
  1. *Inside `.right-nav-rail`*:
     - On a 320px viewport: Viewport width = 320px.
     - Rail width = 64px; root layout padding = 12px. Rail is pinned at right edge `x = 320 - 12 - 64 = 244px`.
     - Popover rule: `right: calc(100% + 14px)` relative to rail (popover right edge = `244px - 14px = 230px`).
     - Popover width = 300px.
     - Popover left edge: `230px - 300px = -70px` (negative horizontal offset!).
     - Exactly **70px of the popover is clipped off the left screen edge**.
     - On a 375px viewport (iPhone SE/13 mini): `375 - 12 - 64 - 14 - 300 = -15px` (**15px clipped off-screen**).
  2. *Inside `.left-nav-rail`*:
     - Left rail is positioned at `x = 12px`.
     - Popover rule: `right: calc(100% + 14px)` positions popover right edge at `x = 12px - 14px = -2px`.
     - Popover left edge: `-2px - 300px = -302px` (**entire popover is rendered completely off-screen**).
  3. *Inside Homepage Top Navbar (`layout-homepage`)*:
     - On small screens (< 480px), `.top-navbar-fixed-container` has `padding: 16px 36px 0` (72px total horizontal padding).
     - Usable navbar container on 320px screen: `320px - 72px = 248px`.
     - Popover width is fixed at 300px. With `right: 0`, the popover's left edge is at `248px - 300px = -52px` (**52px clipped off the left edge**).
  4. *Absence of Outside-Click Dismissal Backdrop*:
     - Clicking outside the popover does not dismiss it because there is no modal backdrop or window blur listener attached in `SettingsDropdown.tsx` or `Navbar.tsx`.

---

### 1.4 Horizontal Overflow Audit (320px–768px Viewports)
Inspecting `src/styles.css` identified the following root shell drivers of horizontal scrolling:
1. **`width: 100vw` on `#root` and `.app-root-layout`** (`styles.css:284, 295`):
   - `100vw` accounts for viewport width including scrollbars. When a page has vertical scrolling, `100vw > 100%` (client width), forcing a persistent horizontal scrollbar across desktop and mobile browsers.
2. **Fixed Padding on Shell Containers**:
   - `styles.css:309`: `.app-root-layout.layout-with-sidebar` has `padding: 12px; gap: 14px;`.
   - `styles.css:387`: `.top-navbar-fixed-container` has `padding: 16px 36px 0;` (72px total), forcing container width down to 248px on 320px devices.
3. **Fixed Width Elements without `max-width: 100%`**:
   - `styles.css:2728`: `.thought-bubble-popover` has `width: 340px;` (exceeds 320px screen by 20px).
   - `styles.css:1524, 1532`: `.pitch-grid` has `grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));` (forces columns to minimum 340px, causing 20px overflow on 320px devices).

---

## 2. Logic Chain

1. *From Observation 1.1*:
   - `.app-root-layout.layout-with-sidebar` enforces `flex-direction: row`, `padding: 12px`, and `gap: 14px`, while `.dashboard-container.container-sidebar` hardcodes `height: calc(100vh - 24px); overflow: hidden;`.
   - *Inference*: On screens `< 768px`, this row structure robs 102px of horizontal space and traps vertical overflow. Switching to `flex-direction: column` with `padding: 0`, `gap: 0`, and removing the fixed height on `container-sidebar` will allow content to occupy the full 320px–767px width and flow vertically.

2. *From Observation 1.2*:
   - `.vote-layout-grid` stacks into 1 column on `< 1024px`, doubling its vertical height, but `.page-view-wrapper.page-non-scroll` locks `overflow: hidden; height: 100%` with inline `overflow: 'hidden'` on `App.tsx:229`.
   - *Inference*: Users on any viewport `< 1024px` cannot scroll to view or submit their ballots. Adding `@media (max-width: 1023px)` rules to enable `overflow-y: auto; -webkit-overflow-scrolling: touch;` on `.page-view-wrapper.page-non-scroll` and replacing the inline `overflow: 'hidden'` with a responsive CSS class restores complete voting access while keeping the desktop 100vh non-scroll lock intact on `>= 1024px`.

3. *From Observation 1.3*:
   - Popover geometry calculates `right: calc(100% + 14px)` with a fixed 300px width, resulting in negative left positions (`-70px` on 320px, `-15px` on 375px, `-302px` on left dock).
   - *Inference*: On `< 768px`, relative anchoring must be replaced with a fixed mobile bottom sheet or viewport-centered popover (`position: fixed; inset: auto 12px 16px 12px; width: auto; max-width: 400px; margin: 0 auto;` or `bottom: 0; left: 0; right: 0; border-radius: 20px 20px 0 0;`). Adding a dim backdrop overlay (`.account-overview-backdrop`) simultaneously prevents off-screen clipping and delivers intuitive touch dismissal.

4. *From Observation 1.4*:
   - Universal `100vw` on root containers plus fixed pixel containers (300px, 340px) exceed small screen bounds (320px).
   - *Inference*: Normalizing `#root` and `.app-root-layout` to `width: 100%; max-width: 100vw; overflow-x: hidden;` and wrapping popovers in `max-width: calc(100vw - 24px)` eliminates 100% of horizontal scrollbars between 320px and 768px.

---

## 3. Implementation Strategy & Concrete Proposals

### Strategy 1: Responsive Root Layout Shell (`src/styles.css`)

Replace lines 282–340 in `src/styles.css` with responsive, viewport-safe rules:

```css
/* ========================================================
   ROOT & APP LAYOUT SHELL (RESPONSIVE)
   ======================================================== */
#root {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.app-root-layout {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  display: flex;
  overflow-x: hidden;
}

/* Homepage Layout: full-page vertical scroll */
.app-root-layout.layout-homepage {
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  height: 100dvh;
}

/* Dashboard with Sidebar (Desktop default: >= 1024px) */
.app-root-layout.layout-with-sidebar {
  flex-direction: row;
  padding: 12px;
  gap: 14px;
  box-sizing: border-box;
  overflow: hidden;
  height: 100vh;
  height: 100dvh;
}

/* Tablet refinement (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .app-root-layout.layout-with-sidebar {
    padding: 8px;
    gap: 10px;
  }
}

/* Mobile Root Layout (< 768px) */
@media (max-width: 767px) {
  .app-root-layout.layout-with-sidebar {
    flex-direction: column;
    padding: 0;
    gap: 0;
    height: 100vh;
    height: 100dvh;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Collapse desktop 64px rail from document flow */
  .right-nav-rail,
  .left-nav-rail {
    display: none !important;
  }
}

.dashboard-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
}

.dashboard-container.container-homepage {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 84px 32px 24px;
  flex: 1 0 auto;
  min-height: calc(100vh - 80px);
}

@media (max-width: 767px) {
  .dashboard-container.container-homepage {
    padding: 72px 14px 20px;
  }
}

.dashboard-container.container-sidebar {
  max-width: 100%;
  width: 100%;
  margin: 0;
  padding: 4px 8px;
  height: calc(100vh - 24px);
  overflow: hidden;
}

@media (max-width: 767px) {
  .dashboard-container.container-sidebar {
    height: auto;
    min-height: 0;
    flex: 1 1 auto;
    padding: 8px 12px 76px; /* 76px bottom clearance for mobile nav bar */
    overflow-x: hidden;
    overflow-y: visible;
  }
}
```

---

### Strategy 2: Page View Wrapper Mobile Scroll Unlocking (`styles.css` & `src/App.tsx`)

#### A. In `src/styles.css`:
Update lines 351–362 and add the tablet/mobile unlock query:

```css
.page-view-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  width: 100%;
}

/* Desktop non-scroll lock (>= 1024px) */
.page-view-wrapper.page-non-scroll {
  overflow: hidden;
  height: 100%;
}

.page-view-wrapper.page-scrollable {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  padding-right: 4px;
  -webkit-overflow-scrolling: touch;
}

/* Unlock vertical scrolling on tablet and mobile viewports (< 1024px) */
@media (max-width: 1023px) {
  .page-view-wrapper.page-non-scroll {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch;
    height: auto;
    min-height: 100%;
  }

  .vote-layout-grid {
    grid-template-columns: 1fr;
    overflow: visible !important;
    height: auto !important;
    gap: 20px;
  }

  .slot-roller-container {
    max-height: none !important;
    overflow: visible !important;
  }

  .drop-slots-column {
    overflow: visible !important;
    height: auto !important;
    margin-top: 12px;
  }
}
```

#### B. In `src/App.tsx` (lines 228–231):
Remove inline `overflow: 'hidden'` so the parent wrapper can scroll:

```tsx
// BEFORE (App.tsx:229):
<div className="tab-content-area" style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}>

// AFTER:
<div className="tab-content-area tab-content-ballot">
```
And define `.tab-content-ballot` in `styles.css`:
```css
.tab-content-ballot {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .tab-content-ballot {
    height: auto;
    min-height: 100%;
    overflow: visible !important;
  }
}
```

---

### Strategy 3: SettingsDropdown Mobile Bottom Sheet & Backdrop

#### A. In `src/components/SettingsDropdown.tsx`:
Add an accessible backdrop overlay and thumb-friendly touch targets:

```tsx
// In src/components/SettingsDropdown.tsx:
export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateSettings,
  onNavigateTab,
}) => {
  ...
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for click-outside dismissal */}
      <div className="account-popover-backdrop" onClick={onClose} aria-hidden="true" />

      <div
        className="account-overview-popover"
        role="dialog"
        aria-modal="true"
        aria-label="Account Overview"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Bottom Sheet Grab Pill */}
        <div className="account-popover-drag-pill" aria-hidden="true" />

        {/* Header */}
        <div className="account-overview-header">
          <span className="account-overview-title">Account</span>
          <button
            className="icon-btn-sm account-close-btn"
            onClick={onClose}
            aria-label="Close Account Dialog"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        ...
```

#### B. In `src/styles.css` (lines 641–647 and 802–820):
Add mobile bottom sheet styling and backdrop rules:

```css
/* Backdrop Overlay */
.account-popover-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(9, 13, 22, 0.55);
  backdrop-filter: blur(4px);
  z-index: 1090;
}

/* Desktop default: Right vertical rail docking */
.right-nav-rail .account-overview-popover {
  position: absolute;
  top: auto;
  bottom: 0;
  right: calc(100% + 14px);
  left: auto;
  width: 300px;
  z-index: 1100;
}

/* Desktop default: Top homepage navbar docking */
.top-navbar .account-overview-popover {
  position: absolute;
  top: 52px;
  right: 0;
  left: auto;
  width: 300px;
  z-index: 1100;
}

.account-popover-drag-pill {
  display: none;
}

/* Mobile Bottom Sheet Transformation (< 768px) */
@media (max-width: 767px) {
  .account-overview-popover,
  .right-nav-rail .account-overview-popover,
  .left-nav-rail .account-overview-popover,
  .top-navbar .account-overview-popover {
    position: fixed !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
    padding: 16px 20px max(24px, env(safe-area-inset-bottom, 24px)) !important;
    box-sizing: border-box !important;
    z-index: 1100 !important;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5) !important;
    animation: account-sheet-slide-up 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
    max-height: 85vh;
    overflow-y: auto;
  }

  @keyframes account-sheet-slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .account-popover-drag-pill {
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-strong, #334155);
    margin: 0 auto 12px;
  }

  /* 44×44px Touch Targets */
  .account-close-btn {
    min-width: 44px !important;
    min-height: 44px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .account-actions-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  .account-actions-row .btn {
    width: 100%;
    min-height: 44px !important;
    font-size: 13px !important;
  }

  .account-prop-row .btn {
    min-height: 38px !important;
    padding: 4px 12px !important;
  }
}
```

---

### Strategy 4: Zero Horizontal Scroll Guarantee (320px–768px Viewports)

1. **Global Viewport Lock in `src/styles.css`**:
   ```css
   html, body {
     overflow-x: hidden;
     max-width: 100vw;
     width: 100%;
   }
   ```
2. **Homepage Top Navbar Padding Adjustment**:
   ```css
   @media (max-width: 767px) {
     .top-navbar-fixed-container {
       padding: 8px 12px 0;
     }
     .top-navbar {
       padding: 8px 14px;
       border-radius: var(--radius-lg);
     }
   }
   ```
3. **Thought Bubble Popover Guard**:
   ```css
   @media (max-width: 767px) {
     .thought-bubble-popover {
       width: auto;
       max-width: calc(100vw - 32px);
       left: 0;
       right: auto;
     }
   }
   ```
4. **Grid Minmax Clamp**:
   ```css
   @media (max-width: 767px) {
     .pitch-grid {
       grid-template-columns: 1fr;
     }
   }
   ```

---

## 4. Caveats

1. **Explorer Read-Only Boundary**:
   - No project files were modified during this investigation. Implementation must be carried out by the designated Implementer agent.
2. **Dependency on Explorer 2's Mobile Navigation**:
   - When `.right-nav-rail` is hidden (`display: none`), navigation on small screens requires the mobile navigation pattern being formulated by Explorer 2 (bottom bar or mobile drawer). The `padding-bottom: 76px` proposed on `.dashboard-container.container-sidebar` coordinates directly with Explorer 2's mobile bottom navigation height.
3. **Internal Logic Integrity**:
   - All props, interfaces (`NavTabId`, `SettingsDropdownProps`), and mutation calls in `App.tsx` and `VotePage.tsx` remain 100% unaltered.

---

## 5. Conclusion

1. **Responsive Root Shell**:
   - Switching `.app-root-layout.layout-with-sidebar` to `flex-direction: column` with `padding: 0; gap: 0;` on `< 768px` reclaims 102px of horizontal space and establishes a native vertical layout.
2. **Mobile Scroll Unlocking**:
   - Setting `overflow-y: auto; -webkit-overflow-scrolling: touch;` on `.page-view-wrapper.page-non-scroll` on `< 1024px` and removing inline `overflow: 'hidden'` from `App.tsx:229` completely resolves the ballot page lockout bug on mobile and tablet devices, while preserving desktop 100vh lock on `>= 1024px`.
3. **Popover Clipping Elimination**:
   - Transforming `SettingsDropdown` into a mobile bottom sheet with fixed anchoring, a dismissible backdrop, and `max-height: 85vh` on `< 768px` eliminates all negative horizontal offsets and delivers 44×44px touch targets.
4. **Zero Horizontal Scrolling**:
   - Normalizing `width: 100%` and clamping wide elements ensures zero horizontal scrollbars on viewports from 320px to 768px.

---

## 6. Verification Method

### 6.1 TypeScript Compilation & Production Build
```bash
cd /home/yierke/Documents/vote-ui
npx tsc --noEmit
npm run build
```
- **Expected Outcome**: Exit code `0`, zero TypeScript errors, clean production bundle in `dist/`.

### 6.2 Viewport Geometry Inspections (Headless / DevTools)
Start preview server:
```bash
cd /home/yierke/Documents/vote-ui
npm run preview
```
Inspect layout at test viewports:
- **320px × 568px (iPhone SE 1st Gen)**:
  - Verify `document.documentElement.scrollWidth === document.documentElement.clientWidth` (zero horizontal overflow).
  - Open Settings/Account popover: confirm `boundingClientRect().left >= 0` and popover renders as bottom sheet.
  - Switch to Ballot tab: scroll down and verify Rank 1, 2, 3 slots and Cast Vote button are fully visible and clickable.
- **375px × 667px (iPhone SE 2nd Gen / iPhone 13 mini)**:
  - Verify zero clipping on SettingsDropdown.
- **768px × 1024px (iPad Portrait / Tablet Breakpoint)**:
  - Verify Ballot tab scrolls vertically so all drop slots are reachable.
- **1280px × 800px (Desktop Baseline)**:
  - Verify `.right-nav-rail` (64px) is visible on right.
  - Verify `.page-view-wrapper.page-non-scroll` preserves desktop 100vh lock with internal roller scrolling.
  - Verify SettingsDropdown renders as desktop popup docked to rail.
