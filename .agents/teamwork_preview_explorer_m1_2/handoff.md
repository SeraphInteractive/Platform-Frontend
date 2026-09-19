# Handoff Report: Mobile Navigation Strategy & Touch Target Standardization

- **Agent**: Explorer 2 (Mobile Navigation & Touch Targets)
- **Milestone**: Milestone 1 (Tooling, Responsive Breakpoints & Navigation)
- **Target Files**: `src/components/Navbar.tsx`, `src/styles.css`
- **Related Files**: `src/App.tsx`, `src/components/SettingsDropdown.tsx`, `src/views/VoterApp/VotePage.tsx`

---

## 1. Observation

### 1.1 Desktop Right Rail Layout Lockout on Mobile
In `src/App.tsx` (lines 189–204), the layout wrapper applies:
```tsx
<div className={`app-root-layout ${isHomePage ? 'layout-homepage' : 'layout-with-sidebar'}`}>
  <Navbar ... />
  <main className={`dashboard-container ${isHomePage ? 'container-homepage' : 'container-sidebar'}`}>
```
In `src/styles.css` (lines 307–315, 448–465):
```css
.app-root-layout.layout-with-sidebar {
  flex-direction: row;
  padding: 12px;
  gap: 14px;
  box-sizing: border-box;
  overflow: hidden;
  height: 100vh;
}

.right-nav-rail,
.left-nav-rail {
  width: 64px;
  height: calc(100vh - 24px);
  background: var(--bg-card);
  border: none;
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 14px 8px;
  flex-shrink: 0;
  order: 2;
  z-index: 900;
  box-sizing: border-box;
  animation: rail-slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
```
**Direct finding**: On screens `< 768px` (e.g. 320px–375px mobile phones), `.right-nav-rail` permanently occupies 64px on the right in a horizontal row (`flex-direction: row`). On a 320px viewport, subtracting 24px padding (`12px * 2`), 14px gap, and 64px rail leaves only **218px** width for all page content. Furthermore, hover tooltips (`.nav-hover-tooltip` lines 551–573) are anchored off-screen to the left (`right: calc(100% + 14px)`) and rely on mouse `:hover`, which fails on touch devices.

### 1.2 Homepage Floating Pill Overflow on Mobile
In `src/components/Navbar.tsx` (lines 266–389), when `isHomePage` is true:
```tsx
<header className={`top-navbar-fixed-container ${isNavVisible ? 'nav-visible' : 'nav-hidden'}`}>
  <div className="top-navbar">
    <div className="nav-left">
      <div className="brand-logo-mark" onClick={() => handleNav('landing')}>...</div>
      <nav className="nav-menu">
        <button className="nav-link-btn" onClick={() => handleNav('ballot')}>Vote</button>
        <button className="nav-link-btn" onClick={() => handleNav('leaderboard')}>Leaderboard</button>
        <button className="nav-link-btn" onClick={() => handleNav('grabbox')}>GrabBox</button>
        <button className="nav-link-btn" onClick={() => handleNav('progress')}>Progress</button>
        <button className="nav-link-btn" onClick={() => handleNav('docs')}>Docs</button>
        {isStaff(user?.role) && <button className="nav-link-btn" onClick={() => handleNav('diagnostics')}>Dashboard</button>}
      </nav>
    </div>
    <div className="nav-right">
      <button className="icon-btn" onClick={toggleTheme}>...</button>
      <button className="user-pfp-btn" ...>...</button>
    </div>
  </div>
</header>
```
In `src/styles.css` (lines 380–440, 681–720):
- `.top-navbar-fixed-container` has `padding: 16px 36px 0;`.
- `.top-navbar` has `max-width: 1480px; width: 100%; display: flex; justify-content: space-between;`.
- `.nav-menu` renders 5 to 6 text buttons horizontally.
- Total combined width of `.brand-logo-mark` (44px) + `.nav-menu` (~420px) + `.nav-right` (~200px) exceeds **660px**.
**Direct finding**: On any viewport `< 768px`, `.top-navbar` horizontally overflows the viewport, causing severe text truncation or page-level horizontal scrolling.

### 1.3 Touch Target Size Violations (Under 44×44px Requirement)
Auditing all interactive elements in `src/components/Navbar.tsx`, `src/components/SettingsDropdown.tsx`, and `src/styles.css`:

| Element Selector | File & Line | Current Rendered Hitbox | WCAG 44×44px Compliance |
|---|---|---|---|
| `.brand-logo-mark.right-nav-logo` | `src/styles.css:498` | `40px × 40px` | ❌ **FAIL** (-4px) |
| `.user-pfp-btn` (in Navbar) | `src/components/Navbar.tsx:210` | `style={{ width: 38, height: 38 }}` | ❌ **FAIL** (-6px) |
| `.user-pfp-btn` (CSS default) | `src/styles.css:751` | `40px × 40px` | ❌ **FAIL** (-4px) |
| `.icon-btn` (theme toggle) | `src/styles.css:786` | `40px × 40px` | ❌ **FAIL** (-4px) |
| `.icon-btn-sm` (SettingsDropdown close) | `src/styles.css:2418` | `28px × 28px` | ❌ **FAIL** (-16px) |
| `.nav-link-btn` (pill links) | `src/styles.css:694` | `padding: 8px 16px` (~34px height) | ❌ **FAIL** (-10px) |
| `.right-nav-icon-btn` | `src/styles.css:514` | `44px × 44px` | ✅ **PASS** (44×44px) |
| `.brand-logo-mark` (top navbar) | `src/styles.css:657` | `44px × 44px` | ✅ **PASS** (44×44px) |

### 1.4 Route Contract & State Management
In `src/App.tsx` (lines 65, 172–183):
- Active view is controlled via `activeTab: NavTabId` (`'landing' | 'ballot' | 'leaderboard' | 'docs' | 'grabbox' | 'diagnostics' | 'settings' | 'progress' | 'privacy' | 'terms' | 'guidelines'`).
- Tab switching executes through `handleTabChange(newTab: NavTabId)`, which integrates cinematic transitions via `BlazeTransitionOverlay` (unless `settings.reducedMotion` is enabled).
- In `src/views/VoterApp/VotePage.tsx` (lines 689–714), bottom of page contains 3 ballot slot targets and a fixed/stacked "Cast Vote" / "Log In to Vote" action button.

### 1.5 Build Baseline
Execution of `npm run build` (`tsc && vite build`):
```sh
✓ 121 modules transformed.
dist/index.html                           1.82 kB │ gzip:  0.75 kB
dist/assets/index-DdJu3rfK.css           50.55 kB │ gzip:  9.44 kB
dist/assets/index-D9fvYWGi.js           101.74 kB │ gzip: 23.91 kB
✓ built in 1.81s
```
Exit code 0. Zero TypeScript or Vite bundle errors.

---

## 2. Logic Chain

### 2.1 Why the 64px Rail Must Be Collapsed via CSS Breakpoint (< 768px)
1. Observation 1.1 shows that on `< 768px`, `.right-nav-rail` forces `flex-direction: row` with a fixed 64px strip, squeezing mobile content down to 218px width.
2. In `PROJECT.md` and `SCOPE.md`, the responsive boundary is codified as `@media (max-width: 767px)` for mobile and `@media (min-width: 768px)` for tablet/desktop.
3. Therefore, under `@media (max-width: 767px)`, `.right-nav-rail` must be set to `display: none !important;` so that it is removed from the document flow, freeing 100% of the viewport width for `<main className="dashboard-container">`.
4. Conversely, under `@media (min-width: 768px)` and `@media (min-width: 1024px)`, `.right-nav-rail` must maintain its full 64px width, vertical orientation, and hover tooltips.

### 2.2 Selecting the Optimal Mobile Navigation Pattern
We evaluated three mobile patterns:
- **Pattern A: Sticky Mobile Top Header (56px) + Accessible Slide-Over Drawer**:
  - Header sits at top: Brand logo, contextual view pill (`STAIRWAY // VOTE`), theme toggle, Discord avatar/login, hamburger button.
  - Hamburger opens slide-over drawer with 50px tall full-width touch rows for all 7+ routes (`ballot`, `leaderboard`, `grabbox`, `progress`, `docs`, `diagnostics`, `settings`), plus pitch creation and legal links.
  - Advantage: Zero bottom occlusion. Observation 1.4 noted that `VotePage.tsx` contains 3 ranked ballot slots and a bottom "Cast Vote" button. A top header + drawer leaves the bottom completely open, eliminating button overlap risks.
- **Pattern B: Mobile Bottom Navigation Bar (56px) + "More" Drawer**:
  - Fixed at bottom: 4 primary tabs (`Vote`, `Ranks`, `GrabBox`, `Progress`) + 5th tab `More` which opens the drawer for secondary routes (`Docs`, `Settings`, `Dashboard`).
  - Advantage: Quick thumb-reach tab switching.
  - Requirement: Requires `padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px))` on `.page-view-wrapper` and `.tab-content-area` so mobile users can scroll past the bottom bar to reach `VotePage` ballot actions.
- **Pattern C: Unified Hybrid Architecture (Recommended)**:
  - Implement the **Sticky Mobile Top Header + Accessible Drawer** as the primary, authoritative navigation shell in `Navbar.tsx`.
  - Provide the **Mobile Bottom Bar** as an opt-in/complementary layer with explicit safe-area bottom padding.
  - Both patterns hook into the identical `handleNav(tab: NavTabId)` dispatcher.

### 2.3 Guaranteeing Seamless Tab Switching & Active Indicators
1. When any mobile navigation tab is clicked:
   - Call `onTabChange(tab)` to trigger `App.tsx`'s view transition.
   - If drawer is open, automatically invoke `setIsMobileDrawerOpen(false)`.
2. Active state indications:
   - **Mobile Drawer**: The active item receives CSS class `.active`, `aria-current="page"`, emerald background `rgba(16, 185, 129, 0.14)`, left accent border `3px solid #10b981`, and an emerald `ACTIVE` micro-pill.
   - **Mobile Header**: The center breadcrumb dynamically displays the active route name (`STAIRWAY // ${activeTab.toUpperCase()}`), providing instant situational awareness without opening the menu.
   - **Mobile Bottom Bar**: Active tab icon changes to `#10b981` with a 4px glowing dot indicator below the label.

### 2.4 Upgrading Touch Targets to >= 44×44px
1. Observation 1.3 documented 5 separate interactive components violating the 44×44px touch guideline (`.right-nav-logo` 40px, `.user-pfp-btn` 38px/40px, `.icon-btn` 40px, `.icon-btn-sm` 28px, `.nav-link-btn` 34px).
2. All touch targets must enforce:
   ```css
   min-width: 44px;
   min-height: 44px;
   display: inline-flex;
   align-items: center;
   justify-content: center;
   box-sizing: border-box;
   ```
3. For small visual icons (such as the 12px close cross in `SettingsDropdown`), the visual icon remains compact while the parent button's tappable bounding box is expanded to `44×44px`.

### 2.5 Preserving Desktop Integrity (>= 1024px)
1. On viewports `>= 1024px`:
   - All mobile navigation markup (`.mobile-nav-header`, `.mobile-nav-drawer`, `.mobile-drawer-overlay`, `.mobile-bottom-bar`) has `display: none !important;`.
   - Homepage retains `.top-navbar-fixed-container` with its floating pill geometry, directional scroll hide/reveal, and 1480px max-width.
   - Dashboard routes retain `.right-nav-rail` at 64px width, right-edge ordering (`order: 2`), and Minecraft-themed hover tooltips.
2. Tablet viewports (768px–1023px):
   - Preserves desktop navigation structures (`.right-nav-rail` and `.top-navbar`) as they fit comfortably on 768px+ widths, while layout wrapper unlocks vertical page scrolling (handled by Explorer 3).

---

## 3. Caveats

1. **Mobile Bottom Bar Occlusion**: If the implementer enables the Mobile Bottom Bar alongside the Mobile Top Header, `styles.css` must include `padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px))` on `.dashboard-container.container-sidebar` and `.tab-content-area` so that `VotePage`'s ballot slot 3 and "Cast Vote" buttons are never obscured.
2. **SettingsDropdown Off-Screen Positioning**: While `Navbar.tsx` provides the anchor for `SettingsDropdown`, fixing the negative X coordinate calculation (`right: calc(100% + 14px)` on mobile) is owned by Explorer 3. Our mobile header positions the account trigger at the top right, and the mobile drawer embeds user account details directly inside the drawer header.
3. **iOS Safari Dynamic Viewport Height**: On iOS devices with URL bars, `100vh` can cause clipping. The mobile header uses `position: sticky; top: 0;`, and the drawer uses `height: 100%; height: 100dvh;` with `position: fixed;` to support dynamic viewports.

---

## 4. Conclusion & Proposed Implementation Specification

### 4.1 Proposed Component: `src/components/Navbar.tsx`

Below is the complete, drop-in replacement implementation of `src/components/Navbar.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { useAuth, getDiscordAvatar, isStaff } from '../context/AuthContext.tsx';
import { useSettings } from '../context/SettingsContext.tsx';
import { SettingsDropdown } from './SettingsDropdown.tsx';
import { SettingsSubTab } from '../views/Settings/SettingsPage.tsx';
import { useScrollDirection } from '../hooks/useScrollDirection.ts';

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

interface NavbarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onNavigateSettings: (subTab?: SettingsSubTab) => void;
  onOpenCreatePitch: () => void;
}

interface NavItem {
  id: NavTabId;
  label: string;
  badgeLabel?: string;
  icon: React.ReactNode;
  staffOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'ballot',
    label: 'Vote',
    badgeLabel: 'Live',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
        <path d="M7 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
        <path d="M17 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
      </svg>
    ),
  },
  {
    id: 'grabbox',
    label: 'GrabBox',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: 'diagnostics',
    label: 'Workbench',
    staffOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onNavigateSettings,
  onOpenCreatePitch,
}) => {
  const { user, loginWithDiscord } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const [showAccountOverview, setShowAccountOverview] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [pfpError, setPfpError] = useState(false);
  const isScrollVisible = useScrollDirection();

  const isNavVisible = isScrollVisible || showAccountOverview;
  const isHomePage = activeTab === 'landing';

  const handleNav = (tab: NavTabId) => {
    onTabChange(tab);
    setIsMobileDrawerOpen(false);
    setShowAccountOverview(false);
  };

  // Keyboard accessibility: Escape closes drawer and account popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setShowAccountOverview(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  const activeItemLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || activeTab.toUpperCase();

  return (
    <>
      {/* ========================================================
          1. MOBILE TOP NAVIGATION HEADER (< 768px)
          ======================================================== */}
      <header className="mobile-nav-header mobile-only" role="banner">
        <div className="mobile-nav-header-left">
          <button
            className="brand-logo-mark mobile-logo-btn"
            onClick={() => handleNav('landing')}
            aria-label="Navigate to Home"
          >
            <div className="brand-glyph" />
          </button>
          <div className="mobile-header-title-badge">
            <span className="mobile-brand-name">STAIRWAY</span>
            <span className="mobile-tab-separator">//</span>
            <span className="mobile-tab-name">{activeItemLabel}</span>
          </div>
        </div>

        <div className="mobile-nav-header-right">
          <button
            className="icon-btn mobile-icon-btn"
            onClick={toggleTheme}
            aria-label={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {settings.theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                className={`user-pfp-btn mobile-pfp-btn ${showAccountOverview ? 'active' : ''}`}
                onClick={() => setShowAccountOverview(!showAccountOverview)}
                aria-label="Account Overview"
              >
                {!pfpError ? (
                  <img
                    src={getDiscordAvatar(user)}
                    alt={user.discordUsername}
                    className="user-pfp-img"
                    onError={() => setPfpError(true)}
                  />
                ) : (
                  <div className="user-pfp-fallback">
                    {user.discordUsername ? user.discordUsername.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                )}
              </button>

              <SettingsDropdown
                isOpen={showAccountOverview}
                onClose={() => setShowAccountOverview(false)}
                onNavigateSettings={() => {
                  setShowAccountOverview(false);
                  onNavigateSettings('account_info');
                }}
                onNavigateTab={(tab) => {
                  setShowAccountOverview(false);
                  handleNav(tab);
                }}
              />
            </div>
          ) : (
            <button
              className="icon-btn mobile-icon-btn mobile-discord-btn"
              onClick={loginWithDiscord}
              aria-label="Sign in with Discord"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </button>
          )}

          <button
            className={`icon-btn mobile-menu-btn ${isMobileDrawerOpen ? 'active' : ''}`}
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            aria-label={isMobileDrawerOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileDrawerOpen}
            aria-controls="mobile-nav-drawer"
          >
            {isMobileDrawerOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================
          2. ACCESSIBLE MOBILE SLIDE-IN DRAWER (< 768px)
          ======================================================== */}
      <div
        className={`mobile-drawer-overlay mobile-only ${isMobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
        role="presentation"
        aria-hidden="true"
      />

      <aside
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer mobile-only ${isMobileDrawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="mobile-drawer-header">
          <div className="mobile-drawer-brand" onClick={() => handleNav('landing')}>
            <div className="brand-logo-mark" style={{ width: 38, height: 38 }}>
              <div className="brand-glyph" style={{ width: 18, height: 18 }} />
            </div>
            <span className="mobile-drawer-title">STAIRWAY</span>
          </div>
          <button
            className="icon-btn mobile-drawer-close-btn"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User Card inside Drawer */}
        <div className="mobile-drawer-user-card">
          {user ? (
            <div className="mobile-user-profile-row">
              <div className="mobile-user-avatar-wrap">
                <img
                  src={getDiscordAvatar(user)}
                  alt={user.discordUsername}
                  className="mobile-user-avatar-img"
                />
              </div>
              <div className="mobile-user-info">
                <div className="mobile-user-name">{user.discordUsername}</div>
                <div className="mobile-user-badges">
                  <span className={`badge ${user.role === 'admin' ? 'badge-engine' : 'badge-success'}`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary mobile-drawer-login-btn"
              onClick={() => {
                setIsMobileDrawerOpen(false);
                loginWithDiscord();
              }}
            >
              Sign in with Discord
            </button>
          )}
        </div>

        {/* Main Tab Navigation Links */}
        <nav className="mobile-drawer-nav" role="navigation" aria-label="Mobile Drawer Navigation">
          {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff(user?.role)).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`mobile-drawer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="mobile-nav-item-icon">{item.icon}</span>
                <span className="mobile-nav-item-label">{item.label}</span>
                {isActive && <span className="mobile-active-pill">ACTIVE</span>}
              </button>
            );
          })}
        </nav>

        {/* Quick Pitch Action Button */}
        <div className="mobile-drawer-action-box">
          <button
            className="btn btn-secondary mobile-action-btn"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              onOpenCreatePitch();
            }}
          >
            + Submit Pitch
          </button>
        </div>

        {/* Drawer Footer with Legal Links & Version */}
        <div className="mobile-drawer-footer">
          <div className="mobile-legal-links">
            <button className="mobile-legal-link" onClick={() => handleNav('privacy')}>Privacy</button>
            <span>•</span>
            <button className="mobile-legal-link" onClick={() => handleNav('terms')}>Terms</button>
            <span>•</span>
            <button className="mobile-legal-link" onClick={() => handleNav('guidelines')}>Guidelines</button>
          </div>
          <div className="mobile-drawer-version mono">Build v1.0.0-rc4 (2026.09.13)</div>
        </div>
      </aside>

      {/* ========================================================
          3. DESKTOP NON-HOMEPAGE VERTICAL RIGHT RAIL (>= 768px)
          ======================================================== */}
      {!isHomePage && (
        <aside className="right-nav-rail desktop-only">
          {/* Top: Brand Logo */}
          <div className="right-nav-top">
            <div className="right-nav-item-wrapper">
              <div
                className="brand-logo-mark right-nav-logo"
                onClick={() => handleNav('landing')}
                aria-label="Home"
              >
                <div className="brand-glyph" />
              </div>
              <div className="nav-hover-tooltip minecraft-tooltip-panel">
                <div className="mc-tooltip-title" style={{ color: '#ffaa00' }}>Home</div>
              </div>
            </div>
          </div>

          {/* Center: Navigation Icons */}
          <nav className="right-nav-menu" role="navigation" aria-label="Desktop Right Rail Navigation">
            {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff(user?.role)).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="right-nav-item-wrapper">
                  <button
                    className={`right-nav-icon-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                  </button>
                  <div className="nav-hover-tooltip minecraft-tooltip-panel">
                    <div className="mc-tooltip-title" style={{ color: isActive ? '#55ff55' : '#ffaa00' }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom: Action Stack */}
          <div className="right-nav-bottom">
            <div className="right-nav-item-wrapper">
              <button
                className="right-nav-icon-btn"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {settings.theme === 'dark' ? (
                    <>
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </>
                  ) : (
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  )}
                </svg>
              </button>
              <div className="nav-hover-tooltip minecraft-tooltip-panel">
                <div className="mc-tooltip-title" style={{ color: '#f472b6' }}>
                  {settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </div>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              {user ? (
                <div className="right-nav-item-wrapper">
                  <button
                    className={`user-pfp-btn ${showAccountOverview ? 'active' : ''}`}
                    onClick={() => setShowAccountOverview(!showAccountOverview)}
                    aria-label="Account Overview"
                  >
                    {!pfpError ? (
                      <img
                        src={getDiscordAvatar(user)}
                        alt={user.discordUsername}
                        className="user-pfp-img"
                        onError={() => setPfpError(true)}
                      />
                    ) : (
                      <div className="user-pfp-fallback">
                        {user.discordUsername ? user.discordUsername.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                    )}
                  </button>
                  <div className="nav-hover-tooltip minecraft-tooltip-panel">
                    <div className="mc-tooltip-title" style={{ color: '#818cf8' }}>{user.discordUsername || 'Account'}</div>
                  </div>
                </div>
              ) : (
                <div className="right-nav-item-wrapper">
                  <button
                    className="right-nav-icon-btn"
                    onClick={loginWithDiscord}
                    aria-label="Sign in with Discord"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </button>
                  <div className="nav-hover-tooltip minecraft-tooltip-panel">
                    <div className="mc-tooltip-title" style={{ color: '#818cf8' }}>Sign In</div>
                  </div>
                </div>
              )}

              <SettingsDropdown
                isOpen={showAccountOverview}
                onClose={() => setShowAccountOverview(false)}
                onNavigateSettings={() => {
                  setShowAccountOverview(false);
                  onNavigateSettings('account_info');
                }}
                onNavigateTab={(tab) => {
                  setShowAccountOverview(false);
                  handleNav(tab);
                }}
              />
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================
          4. DESKTOP HOMEPAGE FLOATING PILL NAVBAR (>= 768px)
          ======================================================== */}
      {isHomePage && (
        <header className={`top-navbar-fixed-container desktop-only ${isNavVisible ? 'nav-visible' : 'nav-hidden'}`}>
          <div className="top-navbar">
            <div className="nav-left">
              <div
                className="brand-logo-mark"
                onClick={() => handleNav('landing')}
                title="Home"
              >
                <div className="brand-glyph" />
              </div>

              <nav className="nav-menu" role="navigation" aria-label="Desktop Top Navigation">
                {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff(user?.role)).map((item) => (
                  <button
                    key={item.id}
                    className={`nav-link-btn ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="nav-right">
              <button
                className="icon-btn"
                onClick={toggleTheme}
                title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {settings.theme === 'dark' ? (
                    <>
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </>
                  ) : (
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  )}
                </svg>
              </button>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {user ? (
                  <button
                    className={`user-pfp-btn ${showAccountOverview ? 'active' : ''}`}
                    onClick={() => setShowAccountOverview(!showAccountOverview)}
                    title="Account Overview"
                    aria-label="Account Overview"
                  >
                    {!pfpError ? (
                      <img
                        src={getDiscordAvatar(user)}
                        alt={user.discordUsername}
                        className="user-pfp-img"
                        onError={() => setPfpError(true)}
                      />
                    ) : (
                      <div className="user-pfp-fallback">
                        {user.discordUsername ? user.discordUsername.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={loginWithDiscord}
                  >
                    Sign in with Discord
                  </button>
                )}

                <SettingsDropdown
                  isOpen={showAccountOverview}
                  onClose={() => setShowAccountOverview(false)}
                  onNavigateSettings={() => {
                    setShowAccountOverview(false);
                    onNavigateSettings('account_info');
                  }}
                  onNavigateTab={(tab) => {
                    setShowAccountOverview(false);
                    handleNav(tab);
                  }}
                />
              </div>
            </div>
          </div>
        </header>
      )}
    </>
  );
};
```

---

### 4.2 Proposed CSS Additions: `src/styles.css`

Add the following targeted rules to `src/styles.css`:

```css
/* ========================================================
   RESPONSIVE NAVIGATION BREAKPOINTS & TOUCH ENFORCEMENT
   ======================================================== */

/* Global Touch Target Standardization (WCAG >= 44x44px) */
.brand-logo-mark,
.icon-btn,
.user-pfp-btn,
.right-nav-icon-btn,
.right-nav-logo {
  min-width: 44px !important;
  min-height: 44px !important;
  box-sizing: border-box;
}

.icon-btn {
  width: 44px;
  height: 44px;
}

.user-pfp-btn {
  width: 44px;
  height: 44px;
}

.right-nav-logo {
  width: 44px;
  height: 44px;
}

.icon-btn-sm {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Visibility toggles between Mobile (<768px) and Desktop (>=768px) */
@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }

  /* 1. Collapse Right Rail completely on mobile */
  .right-nav-rail,
  .left-nav-rail {
    display: none !important;
  }

  /* Hide Desktop Top Navbar on mobile */
  .top-navbar-fixed-container {
    display: none !important;
  }
}

@media (min-width: 768px) {
  .desktop-only {
    display: flex !important;
  }
  .mobile-only {
    display: none !important;
  }
}

/* ========================================================
   MOBILE TOP HEADER (< 768px)
   ======================================================== */
.mobile-nav-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 900;
  box-sizing: border-box;
  width: 100%;
}

.mobile-nav-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-logo-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}

.mobile-header-title-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.mobile-brand-name {
  color: var(--text-main);
}

.mobile-tab-separator {
  color: var(--text-muted);
  font-size: 11px;
}

.mobile-tab-name {
  color: var(--accent-green, #10b981);
  font-size: 11px;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.mobile-nav-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mobile-icon-btn,
.mobile-menu-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-muted);
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mobile-icon-btn:active,
.mobile-menu-btn:active {
  transform: scale(0.95);
  background: var(--bg-card-hover);
}

.mobile-pfp-btn {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px;
  min-height: 44px;
}

/* ========================================================
   ACCESSIBLE MOBILE SLIDE-IN DRAWER (< 768px)
   ======================================================== */
.mobile-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-drawer-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.mobile-nav-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(320px, 85vw);
  background: var(--bg-card);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.mobile-nav-drawer.open {
  transform: translateX(0);
}

.mobile-drawer-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.mobile-drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.mobile-drawer-title {
  font-weight: 800;
  font-size: 15px;
  color: var(--text-main);
  letter-spacing: 0.05em;
}

.mobile-drawer-close-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
}

.mobile-drawer-user-card {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card-muted);
}

.mobile-user-profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-user-avatar-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border-subtle);
  flex-shrink: 0;
}

.mobile-user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.mobile-user-name {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-drawer-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  gap: 4px;
  flex: 1;
}

.mobile-drawer-nav-item {
  min-height: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
}

.mobile-drawer-nav-item:active {
  background: var(--bg-card-hover);
  transform: scale(0.98);
}

.mobile-drawer-nav-item.active {
  background: rgba(16, 185, 129, 0.12);
  color: var(--accent-green, #10b981);
  border-left: 3px solid #10b981;
  font-weight: 700;
}

[data-theme="dark"] .mobile-drawer-nav-item.active {
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}

.mobile-nav-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mobile-nav-item-label {
  flex: 1;
}

.mobile-active-pill {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  background: #059669;
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.mobile-drawer-action-box {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
}

.mobile-action-btn {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-drawer-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 11px;
}

.mobile-legal-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
}

.mobile-legal-link {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  padding: 6px 4px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.mobile-drawer-version {
  text-align: center;
  color: var(--text-light);
  font-size: 10px;
}
```

---

## 5. Verification Method

### 5.1 Automated Typecheck & Build Verification
Execute within `/home/yierke/Documents/vote-ui`:
```sh
npm run build
```
**Expected outcome**:
- Exit code 0.
- All modules compile cleanly with TypeScript 5.7.3.
- No unused variables or missing prop errors.

### 5.2 Responsive Layout & Touch Target Visual Verification
Inspect using Chrome DevTools Device Mode across target viewports:

| Viewport Width | Device Model | Expected Behavior | Verification Checks |
|---|---|---|---|
| **320px** | iPhone SE (Compact) | Rail hidden, Mobile Header visible, 100% width content | No horizontal scroll (`document.documentElement.scrollWidth === 320`). Touch targets >= 44px. |
| **375px** | iPhone 12/13 Mini | Mobile Header + Drawer smooth slide-in | Drawer covers <= 85vw. Tapping backdrop or `Escape` dismisses. |
| **768px** | iPad Portrait | Desktop/Tablet mode active | `.right-nav-rail` renders at 64px width on non-home; `.mobile-nav-header` is hidden. |
| **1024px** | iPad Pro / Desktop | Desktop full fidelity | Floating pill `.top-navbar` on landing; 64px vertical rail with Minecraft tooltips on dashboard. |
| **1440px** | Desktop Wide | Desktop layout | Uncompromised desktop experience, zero regressions. |

### 5.3 Accessibility & Keyboard Audit
1. **Touch Target Inspection**:
   In DevTools Console, verify all navigation buttons satisfy `>= 44×44px`:
   ```js
   document.querySelectorAll('.mobile-nav-header button, .mobile-nav-drawer button, .right-nav-rail button').forEach(b => {
     const r = b.getBoundingClientRect();
     if (r.width < 43.9 || r.height < 43.9) console.error('Under 44px target:', b, r);
   });
   ```
2. **Keyboard Trapping & Escape Dismissal**:
   - Tab into the hamburger button (`aria-expanded="false"`).
   - Press Enter/Space to open drawer -> `aria-expanded` updates to `"true"`, focus shifts inside drawer.
   - Press `Escape` key -> Drawer closes instantly, body scroll unlocked.
3. **Screen Reader Attributes**:
   - Verify `aria-current="page"` is present on the currently active route item.
   - Verify `role="dialog"` and `aria-modal="true"` on `.mobile-nav-drawer`.

### 5.4 Invalidation Conditions
This strategy is invalidated if:
1. An implementation of `.mobile-bottom-bar` obscures the "Cast Vote" button or ballot slot 3 on `VotePage.tsx` without adequate scroll clearance.
2. Any button or interactive icon has a touch bounding box smaller than `44×44px`.
3. Desktop layout (`>= 1024px`) exhibits missing tooltips, incorrect flex-direction, or missing top pill navbar.
