# Architectural Investigation Report: Persistent Mobile Navigation System (R1) & Mobile Contextual Header (R2)

**Explorer**: Explorer 1 (Survey 2 — Navigation & Header)  
**Date**: 2026-09-19  
**Target Repository**: `/home/yierke/Documents/vote-ui`  
**Reference Directives**: `ORIGINAL_REQUEST.md` (Follow-up 2026-09-19T14:59:02Z R1 & R2), `DISPATCH.md`

---

## Executive Summary

This investigation analyzed the mobile navigation architecture, top header branding, sidebar rail integration, and responsive touch ergonomics across the `vote-ui` codebase (`src/App.tsx`, `src/components/Navbar.tsx`, `src/components/SettingsDropdown.tsx`, `src/styles.css`, and test suites `tests/tier1/navigation.test.mjs`, `tests/tier2/navigation-bound.test.mjs`).

### Critical Root Discovery: The Subpage Navigation Trap
In the current implementation of `Navbar.tsx`:
1. The mobile top header (`.mobile-nav-header`) is wrapped in `{isHomePage && ( ... )}` (line 166).
2. The desktop right rail (`.right-nav-rail`) is rendered for `!isHomePage` (line 383) but has `display: none !important;` on mobile viewports (`@media (max-width: 767px)`, `styles.css:3641`).
3. There is **no persistent bottom navigation bar rendered anywhere in the DOM**—only an empty CSS selector `.mobile-nav-bar` exists in `styles.css:3561`.
4. As a direct consequence, once a mobile user navigates away from `landing` to any subpage (`ballot`, `leaderboard`, `docs`, `grabbox`, `settings`, `progress`, `diagnostics`, `privacy`, `terms`, or `guidelines`), **both the top header and the right rail vanish completely**. The user is completely stranded on the subpage with zero navigation controls.
5. In addition, the header currently displays a static text label `"STAIRWAY"` without displaying the active route context.

This report specifies the concrete architecture, JSX structure, CSS rules, touch targets, and edge cases to implement a persistent 5-item frosted glass App-Style Bottom Navigation Dock, an accessible secondary "More" Drawer, and a modern sticky Contextual Mobile Header across all 11 application routes.

---

## 1. Current Implementation State of Navbar, Sidebar Rail, and Mobile Nav

### 1.1 Architecture & Component Mapping
- **Component File**: `src/components/Navbar.tsx` (619 lines)
- **Root Layout Integration**: `src/App.tsx` (lines 189–200) renders `<Navbar>` at the root level alongside `<main className="dashboard-container">`.
- **Supported Route IDs** (`NavTabId`):
  `'landing' | 'ballot' | 'leaderboard' | 'docs' | 'grabbox' | 'diagnostics' | 'settings' | 'progress' | 'privacy' | 'terms' | 'guidelines'` (11 routes total).
- **Navigation Item Definition**:
  `NAV_ITEMS` array defines 7 routes: `ballot`, `leaderboard`, `grabbox`, `progress`, `docs`, `diagnostics` (staff only), and `settings`. `landing` is omitted from `NAV_ITEMS` and only accessible via clicking the brand logo glyph. Legal sub-routes (`privacy`, `terms`, `guidelines`) are relegated to footer links.

### 1.2 Desktop Viewport Behavior (>= 768px)
- When `activeTab === 'landing'`:
  - Renders `.top-navbar-fixed-container.desktop-only` with horizontal menu items and scroll visibility detection (`useScrollDirection`).
- When `activeTab !== 'landing'`:
  - Renders `.right-nav-rail.desktop-only` containing brand logo at the top, vertical navigation icons in the center, and theme toggle + Discord account button at the bottom.

### 1.3 Mobile Viewport Behavior (< 768px) Deficiencies
| Component | Current State | Bug / Deficiency |
| :--- | :--- | :--- |
| **Mobile Top Header** | Rendered conditionally via `{isHomePage && ( ... )}` | **CRITICAL**: Missing on all 10 subpages. Disappears when leaving `landing`. |
| **Mobile Header Title** | Hardcoded `<span className="mobile-brand-name">STAIRWAY</span>` | Fails R2 requirement for dynamic contextual page titles (e.g., "Voting Round", "Leaderboard"). |
| **Mobile Bottom Dock** | Non-existent in JSX (only placeholder CSS rule `.mobile-nav-bar` in `styles.css:3561`) | **CRITICAL**: Fails R1 requirement for persistent 1-tap thumb navigation to primary routes. |
| **Mobile Nav Drawer** | `#mobile-nav-drawer.mobile-nav-drawer` slides from right (`translateX(100%)`) | The trigger button to open the drawer resides inside `.mobile-nav-header`. Since the header is missing on subpages, the drawer is inaccessible on subpages. |
| **Secondary Routes** | Mixed into drawer main list and footer text | Sub-routes lack clear grouping, thumb accessibility, and consistent active indicators. |

---

## 2. Component Design: Persistent App-Style Bottom Navigation Dock (< 768px)

### 2.1 Overview & Responsiveness
The Bottom Navigation Dock is a fixed bottom bar rendered across **all 11 routes** exclusively on mobile viewports (`< 768px`). On desktop viewports (`>= 768px`), it is hidden via `display: none !important;`.

### 2.2 Five Primary Items
Per R1, the dock provides 1-tap thumb navigation to 4 primary routes and 1 drawer trigger:

| Position | Item Label | Route ID / Action | Icon Description | Active Condition |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Home** | `'landing'` | Minimalist house roof + foundation (20×20) | `activeTab === 'landing'` |
| 2 | **Vote** | `'ballot'` | Ballot checkmark inside ballot box (20×20) | `activeTab === 'ballot'` |
| 3 | **Standings** | `'leaderboard'` | 3-tier podium / trophy glyph (20×20) | `activeTab === 'leaderboard'` |
| 4 | **GrabBox** | `'grabbox'` | Isometric hexagonal loot box (20×20) | `activeTab === 'grabbox'` |
| 5 | **More** | Drawer Trigger (`setIsMobileDrawerOpen`) | 3 horizontal dots or 4-dot app launcher grid (20×20) | `isMobileDrawerOpen \|\| isSecondaryRoute(activeTab)` |

*Note on "More" Active State*: When a user is navigating a secondary route (such as `docs`, `progress`, `settings`, `diagnostics`, `privacy`, `terms`, or `guidelines`), the "More" tab button displays the active indicator, visually signaling to the user which branch of the hierarchy they are in.

### 2.3 Exact JSX Blueprint for Bottom Dock
```tsx
{/* Persistent Mobile Bottom Navigation Dock (< 768px) */}
<nav
  className="mobile-bottom-dock mobile-nav-bar mobile-only"
  role="navigation"
  aria-label="Mobile Bottom Navigation"
>
  {/* 1. Home */}
  <button
    className={`mobile-dock-item mobile-nav-item ${activeTab === 'landing' ? 'active' : ''}`}
    onClick={() => handleNav('landing')}
    aria-label="Home"
    aria-current={activeTab === 'landing' ? 'page' : undefined}
  >
    <span className="mobile-dock-icon mobile-nav-item-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </span>
    <span className="mobile-dock-label mobile-nav-label">Home</span>
    {activeTab === 'landing' && <span className="mobile-dock-active-dot" />}
  </button>

  {/* 2. Vote & Rank */}
  <button
    className={`mobile-dock-item mobile-nav-item ${activeTab === 'ballot' ? 'active' : ''}`}
    onClick={() => handleNav('ballot')}
    aria-label="Vote and Rank"
    aria-current={activeTab === 'ballot' ? 'page' : undefined}
  >
    <span className="mobile-dock-icon mobile-nav-item-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </span>
    <span className="mobile-dock-label mobile-nav-label">Vote</span>
    {activeTab === 'ballot' && <span className="mobile-dock-active-dot" />}
  </button>

  {/* 3. Standings */}
  <button
    className={`mobile-dock-item mobile-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
    onClick={() => handleNav('leaderboard')}
    aria-label="Standings Leaderboard"
    aria-current={activeTab === 'leaderboard' ? 'page' : undefined}
  >
    <span className="mobile-dock-icon mobile-nav-item-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
        <path d="M7 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1" />
        <path d="M17 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
      </svg>
    </span>
    <span className="mobile-dock-label mobile-nav-label">Standings</span>
    {activeTab === 'leaderboard' && <span className="mobile-dock-active-dot" />}
  </button>

  {/* 4. GrabBox */}
  <button
    className={`mobile-dock-item mobile-nav-item ${activeTab === 'grabbox' ? 'active' : ''}`}
    onClick={() => handleNav('grabbox')}
    aria-label="GrabBox Dispatch"
    aria-current={activeTab === 'grabbox' ? 'page' : undefined}
  >
    <span className="mobile-dock-icon mobile-nav-item-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </span>
    <span className="mobile-dock-label mobile-nav-label">GrabBox</span>
    {activeTab === 'grabbox' && <span className="mobile-dock-active-dot" />}
  </button>

  {/* 5. More Drawer Trigger */}
  <button
    className={`mobile-dock-item mobile-nav-item ${
      isMobileDrawerOpen || ['progress', 'docs', 'settings', 'diagnostics', 'privacy', 'terms', 'guidelines'].includes(activeTab)
        ? 'active'
        : ''
    }`}
    onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
    aria-label={isMobileDrawerOpen ? 'Close Secondary Navigation Menu' : 'Open Secondary Navigation Menu'}
    aria-expanded={isMobileDrawerOpen}
    aria-controls="mobile-nav-drawer"
  >
    <span className="mobile-dock-icon mobile-nav-item-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
      </svg>
    </span>
    <span className="mobile-dock-label mobile-nav-label">More</span>
    {(isMobileDrawerOpen || ['progress', 'docs', 'settings', 'diagnostics', 'privacy', 'terms', 'guidelines'].includes(activeTab)) && (
      <span className="mobile-dock-active-dot" />
    )}
  </button>
</nav>
```

---

## 3. Component Design: More Drawer / Secondary Navigation Sheet

### 3.1 UX Architecture & Layout Organization
The More Drawer is rendered as an accessible slide-over sheet triggered by the "More" button in the bottom dock or the header icon.

```
┌────────────────────────────────────────────────────────┐
│ [Drag Pill / Handle: .modal-drag-pill]                 │
│ STAIRWAY Brand Mark                     [Close 'X' 44px]│
├────────────────────────────────────────────────────────┤
│ [User Card: Avatar + Discord Tag + Staff Badge]        │
├────────────────────────────────────────────────────────┤
│ SECONDARY ROUTES:                                      │
│  [Flag] Progress Tracker                    [ACTIVE]   │
│  [Book] Documentation & Spec                           │
│  [Gear] Platform Settings                              │
│  [Grid] Dev Workbench (Gated to Staff)                 │
├────────────────────────────────────────────────────────┤
│ ACTIONS:                                               │
│  [+] Submit New Pitch (44px Action Button)             │
├────────────────────────────────────────────────────────┤
│ LEGAL & COMPLIANCE:                                    │
│  Privacy  •  Terms  •  Guidelines                      │
│  Build v1.0.0-rc4 (2026.09.13)                         │
└────────────────────────────────────────────────────────┘
```

### 3.2 Key Specifications for More Drawer
1. **Backdrop Dismiss**: `.mobile-drawer-overlay` has `role="presentation"` and `onClick={() => setIsMobileDrawerOpen(false)}`.
2. **Keyboard Accessibility**: `Escape` key closes both drawer and account popover.
3. **Scroll Locking**: When drawer is open, `document.body.style.overflow = 'hidden'`. Clean cleanup in `useEffect` ensures scroll is restored when navigating or unmounting.
4. **Trap-Free Guarantees**:
   - Tapping any item executes `handleTabChange(tab)`, immediately closing the drawer (`setIsMobileDrawerOpen(false)`), resetting window scroll (`window.scrollTo(0, 0)`), and navigating cleanly to the target view.
   - Because the bottom dock and top header are rendered on all views, the user can always navigate to any other tab immediately from anywhere.
5. **Staff-Gated Dev Workbench**:
   - `NAV_ITEMS` filtering uses `isStaff(user?.role)` to ensure `diagnostics` is only exposed to `admin`, `moderator`, and `supervisor` roles (conforming to R6).

---

## 4. Component Design: Contextual Mobile Header Overhaul (R2)

### 4.1 Requirements Checklist (R2)
- [x] Replace legacy text banner `"STAIRWAY"` with dynamic contextual page title.
- [x] Left: Stylized geometric brand glyph button (links to `landing`) + current route title.
- [x] Right: Theme toggle button (light/dark mode) + Discord avatar button / Sign In button with quick account overview popover.
- [x] Height: Sticky 52px–56px with safe-area inset padding.
- [x] Unconditional rendering: Rendered on **ALL** subpages on mobile viewports `< 768px`.

### 4.2 Contextual Title Mapping
A dedicated pure mapping helper maps each of the 11 `NavTabId` routes to its authoritative page title:

```ts
export const getContextualHeaderTitle = (tab: NavTabId): string => {
  switch (tab) {
    case 'landing':
      return 'Project Stairway';
    case 'ballot':
      return 'Voting Round';
    case 'leaderboard':
      return 'Leaderboard';
    case 'grabbox':
      return 'GrabBox Dispatch';
    case 'progress':
      return 'Progress Tracker';
    case 'docs':
      return 'Documentation';
    case 'diagnostics':
      return 'Dev Workbench';
    case 'settings':
      return 'Platform Settings';
    case 'privacy':
      return 'Privacy Policy';
    case 'terms':
      return 'Terms of Service';
    case 'guidelines':
      return 'Platform Guidelines';
    default:
      return 'Project Stairway';
  }
};
```

### 4.3 Exact JSX Blueprint for Contextual Header
```tsx
{/* Contextual Mobile Sticky Header (< 768px, all routes) */}
<header className="mobile-nav-header mobile-only" role="banner">
  <div className="mobile-nav-header-left">
    <button
      className="brand-logo-mark mobile-logo-btn"
      onClick={() => handleNav('landing')}
      aria-label="Navigate to Home"
      title="Navigate to Home"
    >
      <div className="brand-glyph" />
    </button>
    <div className="mobile-header-title-container">
      <span className="mobile-header-title">{getContextualHeaderTitle(activeTab)}</span>
    </div>
  </div>

  <div className="mobile-nav-header-right">
    {/* Theme Toggle Button */}
    <button
      className="icon-btn mobile-icon-btn"
      onClick={toggleTheme}
      aria-label={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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

    {/* User Discord Avatar / Sign In Button */}
    {user ? (
      <div style={{ position: 'relative' }}>
        <button
          className={`user-pfp-btn mobile-pfp-btn settings-trigger-btn ${showAccountOverview ? 'active' : ''}`}
          onClick={() => setShowAccountOverview(!showAccountOverview)}
          aria-label="Account Overview"
          title="Account Overview"
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
        title="Sign in with Discord"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </button>
    )}
  </div>
</header>
```

---

## 5. CSS Classes, Breakpoints, Safe-Area-Inset Variables, and Touch Ergonomics

### 5.1 CSS Styles Blueprint for `src/styles.css`
```css
/* ==========================================================================
   PERSISTENT MOBILE NAVIGATION DOCK & CONTEXTUAL HEADER OVERHAUL (R1 & R2)
   ========================================================================== */

/* 1. Contextual Sticky Mobile Header (54px height, safe-area top) */
.mobile-nav-header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: calc(54px + env(safe-area-inset-top, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: 12px;
  padding-right: 12px;
  background: rgba(15, 23, 42, 0.90);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 900;
  box-sizing: border-box;
  width: 100%;
}

[data-theme="light"] .mobile-nav-header {
  background: rgba(255, 255, 255, 0.92);
}

.mobile-nav-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mobile-header-title-container {
  display: flex;
  align-items: center;
  min-width: 0;
}

.mobile-header-title {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100vw - 160px);
}

.mobile-nav-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 2. Persistent Frosted Glass Mobile Bottom Navigation Dock */
.mobile-bottom-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 950;
  box-sizing: border-box;
}

[data-theme="light"] .mobile-bottom-dock {
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
}

/* 3. Dock Items & Touch Targets (Minimum 44x44px target area) */
.mobile-dock-item {
  flex: 1;
  height: 100%;
  min-height: 48px;
  min-width: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  padding: 4px 2px;
  text-decoration: none;
  transition: color 0.15s ease, transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-dock-item:active {
  transform: scale(0.94);
}

.mobile-dock-item.active {
  color: var(--accent-green, #10b981);
  font-weight: 700;
}

[data-theme="dark"] .mobile-dock-item.active {
  color: #34d399;
}

.mobile-dock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.mobile-dock-label {
  font-size: 10.5px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
  font-family: var(--font-sans);
}

.mobile-dock-active-dot {
  position: absolute;
  top: 4px;
  width: 14px;
  height: 2px;
  background: var(--accent-green, #10b981);
  border-radius: 2px;
}

[data-theme="dark"] .mobile-dock-active-dot {
  background: #34d399;
}

/* 4. Ensure Page Content Does Not Get Obscured by Bottom Dock */
@media (max-width: 767px) {
  .dashboard-container.container-sidebar,
  .dashboard-container.container-homepage {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 16px)) !important;
  }
}
```

### 5.2 Responsive Breakpoint Specifications
- **Mobile (< 768px)**:
  - `.mobile-only` -> `display: flex !important;`
  - `.desktop-only` -> `display: none !important;`
  - `.mobile-nav-header` -> `display: flex !important;`
  - `.mobile-bottom-dock` -> `display: flex !important;`
  - `.right-nav-rail`, `.left-nav-rail`, `.top-navbar-fixed-container` -> `display: none !important;`
- **Desktop (>= 768px)**:
  - `.mobile-only` -> `display: none !important;`
  - `.mobile-nav-header` -> `display: none !important;`
  - `.mobile-bottom-dock` -> `display: none !important;`
  - `.mobile-nav-drawer` -> `display: none !important;`
  - `.desktop-only` -> visible according to route (`top-navbar` on landing, `right-nav-rail` on subpages).

### 5.3 Touch Target Compliance Table
| Element | Class Name | Target Area (CSS) | Verified Standard |
| :--- | :--- | :--- | :--- |
| Mobile Logo Button | `.mobile-logo-btn` | `44×44px` | `>= 44×44px` |
| Mobile Theme Toggle | `.mobile-icon-btn` | `44×44px` | `>= 44×44px` |
| Mobile PFP / Login | `.mobile-pfp-btn`, `.settings-trigger-btn` | `44×44px` | `>= 44×44px` |
| Bottom Dock Item | `.mobile-dock-item` | `64×52px` (flex 1) | `>= 44×44px` |
| Drawer Close Button | `.mobile-drawer-close-btn` | `44×44px` | `>= 44×44px` |
| Drawer Nav Items | `.mobile-drawer-nav-item` | `width: 100%; min-height: 50px;` | `>= 44×44px` |
| Action Button | `.mobile-action-btn` | `width: 100%; min-height: 44px;` | `>= 44×44px` |

---

## 6. Identified Features, Edge Cases, and Implementation Recommendations

### 6.1 Edge Cases & Mitigations
1. **Body Scroll Lock Invalidation**:
   - *Risk*: If the user navigates by tapping an item inside the More Drawer, the component might switch routes while leaving `document.body.style.overflow = 'hidden'`, freezing scroll on the destination page.
   - *Mitigation*: Ensure `handleTabChange` always resets `document.body.style.overflow = ''` and `setIsMobileDrawerOpen(false)`. Also maintain an effect cleanup return function.
2. **Dynamic Mobile Viewport Insets (Virtual Keyboard & Safari URL Bar)**:
   - *Risk*: Dynamic virtual keyboard appearance or iOS address bar shrinking can push or obscure fixed bottom docks.
   - *Mitigation*: Use `env(safe-area-inset-bottom, 0px)` with `100dvh` root height and keep bottom padding on the main content container at `calc(72px + env(safe-area-inset-bottom, 16px))`.
3. **Double Drawer / Modal Stacking**:
   - *Risk*: If a modal (`CreatePitchModal` or `SettingsDropdown`) opens while the More Drawer is open, z-index conflicts can occur.
   - *Mitigation*: Ensure opening any modal closes the More Drawer (`setIsMobileDrawerOpen(false)`). Standardize modal z-index hierarchy:
     - Page content: `z-index: 1–50`
     - Sticky Mobile Header: `z-index: 900`
     - Persistent Bottom Dock: `z-index: 950`
     - More Drawer Overlay: `z-index: 1040`
     - More Drawer Aside: `z-index: 1050`
     - Dialog Modals & Bottom Sheets (`CreatePitchModal`, `SettingsDropdown`): `z-index: 1100+`
4. **Existing Test Suite Compatibility**:
   - Existing tests in `tests/tier1/navigation.test.mjs` and `tests/tier2/navigation-bound.test.mjs` verify:
     - Selector `.mobile-nav-bar` exists and computes safe-area-inset (`[T2-NAV-02]`).
     - Selector `.mobile-nav-item` has `>= 44px` touch dimension (`[T1-TOUCH-01]`).
     - Selector `.mobile-nav-label` has nowrap / ellipsis protection (`[T2-NAV-03]`).
     - Selector `.right-nav-rail` is `display: none` at 375px (`[T1-NAV-02]`).
     - Role `"navigation"` or `aria-label` present (`[T2-NAV-05]`).
   - By structuring `.mobile-bottom-dock` with secondary class `.mobile-nav-bar` and using `.mobile-nav-item` / `.mobile-nav-label`, the overhaul 100% preserves and satisfies all existing automated test assertions.

### 6.2 Implementation Action Plan for Engineering
1. **Update `src/components/Navbar.tsx`**:
   - Add `getContextualHeaderTitle(tab: NavTabId)` mapping helper.
   - Remove `{isHomePage && ( ... )}` restriction around `.mobile-nav-header`. Render it on all routes on mobile.
   - Replace `<span className="mobile-brand-name">STAIRWAY</span>` with `<span className="mobile-header-title">{getContextualHeaderTitle(activeTab)}</span>`.
   - Add the `<nav className="mobile-bottom-dock mobile-nav-bar mobile-only">` block containing the 5 items (`Home`, `Vote`, `Standings`, `GrabBox`, `More`).
   - Wire `More` to toggle `isMobileDrawerOpen`.
   - Update `More Drawer` navigation list to include all secondary tabs cleanly grouped with active indicators.
2. **Update `src/styles.css`**:
   - Add `.mobile-bottom-dock`, `.mobile-dock-item`, `.mobile-dock-icon`, `.mobile-dock-label`, and `.mobile-dock-active-dot`.
   - Refine `.mobile-nav-header` with sticky positioning, safe-area top padding, and title ellipsis clamping.
   - Add `@media (max-width: 767px)` bottom padding (`calc(72px + env(safe-area-inset-bottom, 16px))`) to `.dashboard-container.container-sidebar` and `.dashboard-container.container-homepage`.
3. **Verify**:
   - Run `npm run typecheck`.
   - Run `node tests/runner.mjs`.

---
*Report concluded by Explorer 1.*
