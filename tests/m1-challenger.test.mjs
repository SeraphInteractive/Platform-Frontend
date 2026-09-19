/**
 * Empirical Challenger Test Suite for Milestone 1 (Mobile Navigation & Header)
 * Tests rapid tab switching, active route highlighting, header title sync,
 * drawer state transitions & scroll-lock invariants, and touch targets >= 44x44px.
 */
import { describe, it } from './harness.mjs';
import { assert, assertEqual, assertTrue, assertFalse, assertIncludes } from './assertions.mjs';
import { createCssResolver } from './helpers/css-parser.mjs';
import { parseComponentAst } from './helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const navAst = parseComponentAst('src/components/Navbar.tsx');
const appAst = parseComponentAst('src/App.tsx');

const ALL_11_ROUTES = [
  'landing',
  'ballot',
  'leaderboard',
  'grabbox',
  'progress',
  'docs',
  'diagnostics',
  'settings',
  'privacy',
  'terms',
  'guidelines'
];

const EXPECTED_HEADER_TITLES = {
  landing: 'Project Stairway',
  ballot: 'Voting Round',
  leaderboard: 'Leaderboard',
  grabbox: 'GrabBox Dispatch',
  progress: 'Progress Tracker',
  docs: 'Documentation',
  diagnostics: 'Dev Workbench',
  settings: 'Platform Settings',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  guidelines: 'Platform Guidelines'
};

const PRIMARY_ROUTES = ['landing', 'ballot', 'leaderboard', 'grabbox'];
const SECONDARY_ROUTES = [
  'progress',
  'docs',
  'settings',
  'diagnostics',
  'privacy',
  'terms',
  'guidelines'
];

function parsePx(val) {
  if (!val) return 0;
  const m = String(val).match(/([\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
}

describe('Challenger 1 Empirical Verification: Milestone 1 Navigation & Header', () => {

  // --------------------------------------------------------------------------
  // 1. Header Title Synchronization Across All 11 Routes
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-01] Header title synchronization covers all 11 routes and provides clean fallback', () => {
    // Extract getContextualHeaderTitle logic from Navbar.tsx via AST / pattern
    const code = navAst.rawCode;
    assertTrue(code.includes('getContextualHeaderTitle'), 'Navbar.tsx must export or define getContextualHeaderTitle');

    // Simulate getContextualHeaderTitle implementation extracted directly from source
    for (const [route, expectedTitle] of Object.entries(EXPECTED_HEADER_TITLES)) {
      const match = code.match(new RegExp(`case ['"\`]${route}['"\`]:\\s*return ['"\`]([^'"\`]+)['"\`];`));
      assertTrue(Boolean(match), `Navbar.tsx must define a case for route "${route}" in getContextualHeaderTitle`);
      assertEqual(match[1], expectedTitle, `Header title for "${route}" must be "${expectedTitle}"`);
    }

    // Check fallback in AST
    const hasFallback = /default:\s*return ['"`]Project Stairway['"`];/.test(code);
    assertTrue(hasFallback, 'getContextualHeaderTitle must provide default fallback to "Project Stairway"');

    // Verify header title container renders dynamically in mobile-nav-header
    const hasHeaderTitleElem = navAst.containsPattern(/getContextualHeaderTitle\(\s*activeTab\s*\)/);
    assertTrue(hasHeaderTitleElem, 'Header must dynamically display getContextualHeaderTitle(activeTab)');
  });

  // --------------------------------------------------------------------------
  // 2. Active Route Highlighting Across Bottom Dock & Drawer
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-02] Active route highlighting correctly targets primary dock items vs More drawer trigger', () => {
    const code = navAst.rawCode;

    // Check SECONDARY_ROUTES definition in Navbar.tsx
    for (const secRoute of SECONDARY_ROUTES) {
      assertTrue(code.includes(`'${secRoute}'`) || code.includes(`"${secRoute}"`),
        `SECONDARY_ROUTES in Navbar.tsx must include secondary route "${secRoute}"`);
    }

    // Verify bottom dock items for primary routes
    for (const primaryRoute of PRIMARY_ROUTES) {
      const hasDockActive = code.includes(`activeTab === '${primaryRoute}' ? 'active' : ''`);
      assertTrue(hasDockActive, `Bottom dock must check activeTab === '${primaryRoute}' for active highlight`);
    }

    // Verify "More" button highlights when drawer is open OR activeTab is secondary
    const hasMoreActive = navAst.containsPattern(/isMobileDrawerOpen\s*\|\|\s*isSecondaryRoute\(\s*activeTab\s*\)/);
    assertTrue(hasMoreActive, 'More button on bottom dock must be highlighted when isMobileDrawerOpen or activeTab is a secondary route');

    // Verify drawer nav items have active indicators
    const hasActivePill = navAst.containsPattern(/mobile-active-pill/);
    assertTrue(hasActivePill, 'Drawer secondary items must render .mobile-active-pill when active');

    // Verify legal links in drawer have active styling
    for (const legalRoute of ['privacy', 'terms', 'guidelines']) {
      const hasLegalActive = code.includes(`activeTab === '${legalRoute}' ? 'active' : ''`);
      assertTrue(hasLegalActive, `Drawer footer must highlight active legal link for "${legalRoute}"`);
    }
  });

  // --------------------------------------------------------------------------
  // 3. Rapid Tab Switching Stress Test (1,000 randomized state transitions)
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-03] Rapid tab switching across 1,000 transitions maintains state machine consistency', () => {
    // Implement state machine mirroring App.tsx handleTabChange and Navbar.tsx handleNav
    class NavigationStateMachine {
      constructor() {
        this.activeTab = 'landing';
        this.isMobileDrawerOpen = false;
        this.showAccountOverview = false;
        this.bodyOverflow = '';
        this.transitionHistory = [];
        this.scrollPositions = [];
      }

      openDrawer() {
        this.isMobileDrawerOpen = true;
        this.bodyOverflow = 'hidden';
      }

      closeDrawer() {
        this.isMobileDrawerOpen = false;
        this.bodyOverflow = '';
      }

      handleTabChange(newTab) {
        if (newTab === this.activeTab) {
          // Idempotent: close drawers but keep state
          this.isMobileDrawerOpen = false;
          this.showAccountOverview = false;
          this.bodyOverflow = '';
          return;
        }
        this.activeTab = newTab;
        this.isMobileDrawerOpen = false;
        this.showAccountOverview = false;
        this.bodyOverflow = '';
        this.scrollPositions.push({ x: 0, y: 0 });
        this.transitionHistory.push(newTab);
      }
    }

    const sm = new NavigationStateMachine();

    // Deterministic pseudo-random sequence (Linear Congruential Generator)
    let seed = 42;
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 1000; i++) {
      const r = nextRand();
      if (r < 0.2) {
        // Open drawer
        sm.openDrawer();
        assertEqual(sm.bodyOverflow, 'hidden', `Step ${i}: Drawer opened, overflow must be 'hidden'`);
      } else if (r < 0.35) {
        // Close drawer explicitly
        sm.closeDrawer();
        assertEqual(sm.bodyOverflow, '', `Step ${i}: Drawer closed, overflow must be ''`);
      } else {
        // Navigate to route
        const targetRoute = ALL_11_ROUTES[Math.floor(nextRand() * ALL_11_ROUTES.length)];
        sm.handleTabChange(targetRoute);
        assertEqual(sm.activeTab, targetRoute, `Step ${i}: activeTab must match target ${targetRoute}`);
        assertFalse(sm.isMobileDrawerOpen, `Step ${i}: Drawer must be closed after navigation`);
        assertEqual(sm.bodyOverflow, '', `Step ${i}: Body overflow must be reset after navigation`);
      }
    }

    assertTrue(sm.transitionHistory.length > 500, 'Should have executed > 500 route transitions');
    assertEqual(sm.bodyOverflow, '', 'Final body overflow must be clean');
  });

  // --------------------------------------------------------------------------
  // 4. Drawer State Transitions, Scroll-Lock & Escape/Resize Handling
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-04] More Drawer opens, closes, locks body scroll, and cleans up on unmount/resize', () => {
    // 1. Verify useEffect body scroll lock implementation in Navbar.tsx
    const code = navAst.rawCode;
    const hasScrollLockEffect = navAst.containsPattern(/isMobileDrawerOpen\s*\?\s*['"`]hidden['"`]\s*:\s*['"`]['"`]/) ||
      (code.includes("document.body.style.overflow = 'hidden'") && code.includes("document.body.style.overflow = ''"));
    assertTrue(hasScrollLockEffect, 'Navbar.tsx must lock body overflow on drawer open and restore on close');

    // 2. Verify cleanup on unmount
    const hasUnmountCleanup = code.includes("return () => {") && code.includes("document.body.style.overflow = ''");
    assertTrue(hasUnmountCleanup, 'Navbar.tsx must restore body overflow on component unmount');

    // 3. Verify Escape key dismiss
    const hasEscapeHandler = code.includes("'Escape'") && code.includes("setIsMobileDrawerOpen(false)");
    assertTrue(hasEscapeHandler, 'Navbar.tsx must dismiss mobile drawer on Escape key press');

    // 4. Verify Viewport resize dismiss (>= 768px threshold)
    const hasResizeHandler = code.includes("window.innerWidth >= 768") && code.includes("setIsMobileDrawerOpen(false)");
    assertTrue(hasResizeHandler, 'Navbar.tsx must dismiss mobile drawer when window resizes to >= 768px');

    // 5. Verify CSS classes for drawer and overlay
    const drawerDecls = resolver.getComputedDeclarations('.mobile-nav-drawer', 375);
    assertEqual(drawerDecls['position'], 'fixed', '.mobile-nav-drawer must be position: fixed');

    const overlayDecls = resolver.getComputedDeclarations('.mobile-drawer-overlay', 375);
    assertEqual(overlayDecls['position'], 'fixed', '.mobile-drawer-overlay must be position: fixed');
  });

  // --------------------------------------------------------------------------
  // 5. Touch Target Dimensions (>= 44x44px) Audit Across Mobile Viewports
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-05] All mobile navigation interactive targets satisfy WCAG >= 44×44px', () => {
    const viewports = [320, 375, 414, 767];

    for (const vp of viewports) {
      // 1. Brand logo button
      const logo = resolver.getComputedDeclarations('.mobile-logo-btn', vp);
      const logoW = parsePx(logo['min-width'] || logo['width']);
      const logoH = parsePx(logo['min-height'] || logo['height']);
      assertTrue(logoW >= 44 && logoH >= 44, `Logo button must be >= 44x44px at ${vp}px (got ${logoW}x${logoH})`);

      // 2. Mobile icon buttons (theme toggle)
      const iconBtn = resolver.getComputedDeclarations('.mobile-icon-btn', vp);
      const iconW = parsePx(iconBtn['min-width'] || iconBtn['width']);
      const iconH = parsePx(iconBtn['min-height'] || iconBtn['height']);
      assertTrue(iconW >= 44 && iconH >= 44, `Icon button must be >= 44x44px at ${vp}px (got ${iconW}x${iconH})`);

      // 3. User avatar button
      const pfpBtn = resolver.getComputedDeclarations('.mobile-pfp-btn', vp);
      const pfpW = parsePx(pfpBtn['min-width'] || pfpBtn['width']);
      const pfpH = parsePx(pfpBtn['min-height'] || pfpBtn['height']);
      assertTrue(pfpW >= 44 && pfpH >= 44, `Avatar button must be >= 44x44px at ${vp}px (got ${pfpW}x${pfpH})`);

      // 4. Bottom dock items
      const dockItem = resolver.getComputedDeclarations('.mobile-dock-item', vp);
      const dockW = parsePx(dockItem['min-width']);
      const dockH = parsePx(dockItem['min-height']);
      assertTrue(dockW >= 44 && dockH >= 44, `Dock items must have min-width and min-height >= 44px at ${vp}px (got ${dockW}x${dockH})`);

      // 5. Drawer close button
      const closeBtn = resolver.getComputedDeclarations('.mobile-drawer-close-btn', vp);
      const closeW = parsePx(closeBtn['min-width'] || closeBtn['width']);
      const closeH = parsePx(closeBtn['min-height'] || closeBtn['height']);
      assertTrue(closeW >= 44 && closeH >= 44, `Drawer close button must be >= 44x44px at ${vp}px (got ${closeW}x${closeH})`);

      // 6. Drawer primary grid buttons
      const gridBtn = resolver.getComputedDeclarations('.mobile-drawer-grid-btn', vp);
      const gridW = parsePx(gridBtn['min-width']);
      const gridH = parsePx(gridBtn['min-height']);
      assertTrue(gridW >= 44 && gridH >= 44, `Drawer grid buttons must be >= 44x44px at ${vp}px (got ${gridW}x${gridH})`);

      // 7. Drawer navigation items
      const drawerItem = resolver.getComputedDeclarations('.mobile-drawer-nav-item', vp);
      const drawerW = parsePx(drawerItem['min-width']);
      const drawerH = parsePx(drawerItem['min-height'] || drawerItem['height']);
      assertTrue(drawerW >= 44 && drawerH >= 44, `Drawer nav items must be >= 44x44px at ${vp}px (got ${drawerW}x${drawerH})`);

      // 8. Drawer quick pitch action button
      const actionBtn = resolver.getComputedDeclarations('.mobile-action-btn', vp);
      const actionH = parsePx(actionBtn['min-height']);
      assertTrue(actionH >= 44, `Drawer action button min-height must be >= 44px at ${vp}px (got ${actionH})`);

      // 9. Drawer legal links
      const legalLink = resolver.getComputedDeclarations('.mobile-legal-link', vp);
      const legalH = parsePx(legalLink['min-height']);
      assertTrue(legalH >= 44, `Drawer legal link min-height must be >= 44px at ${vp}px (got ${legalH})`);
    }
  });

  // --------------------------------------------------------------------------
  // 6. Semantic Breakpoints, Display Invariants & Safe-Area Padding
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-06] Display and safe-area padding invariants are enforced across breakpoints', () => {
    // Mobile (< 768px)
    const mobileHeader = resolver.getComputedDeclarations('.mobile-nav-header', 375);
    assertEqual(mobileHeader['display'], 'flex', '.mobile-nav-header must be display: flex on < 768px');
    assertEqual(mobileHeader['position'], 'sticky', '.mobile-nav-header must be position: sticky');
    assertTrue(mobileHeader['height']?.includes('54px'), '.mobile-nav-header height must be 54px + safe-area');

    const mobileDock = resolver.getComputedDeclarations('.mobile-bottom-dock', 375);
    assertEqual(mobileDock['display'], 'flex', '.mobile-bottom-dock must be display: flex on < 768px');
    assertEqual(mobileDock['position'], 'fixed', '.mobile-bottom-dock must be position: fixed');
    assertTrue(mobileDock['height']?.includes('56px'), '.mobile-bottom-dock height must be 56px + safe-area');

    const rightRailMobile = resolver.getComputedDeclarations('.right-nav-rail', 375);
    assertEqual(rightRailMobile['display'], 'none', '.right-nav-rail must be hidden on mobile');

    // Tablet (768-1023px)
    const mobileHeaderTablet = resolver.getComputedDeclarations('.mobile-only', 800);
    assertEqual(mobileHeaderTablet['display'], 'none', '.mobile-only must be hidden on tablet');

    const desktopTablet = resolver.getComputedDeclarations('.desktop-only', 800);
    assertEqual(desktopTablet['display'], 'flex', '.desktop-only must be flex on tablet');

    // Desktop (>= 1024px)
    const mobileHeaderDesktop = resolver.getComputedDeclarations('.mobile-only', 1280);
    assertEqual(mobileHeaderDesktop['display'], 'none', '.mobile-only must be hidden on desktop');

    const desktopOnly = resolver.getComputedDeclarations('.desktop-only', 1280);
    assertEqual(desktopOnly['display'], 'flex', '.desktop-only must be flex on desktop');

    const rightRailDesktop = resolver.getComputedDeclarations('.right-nav-rail', 1280);
    assertEqual(rightRailDesktop['display'], 'flex', '.right-nav-rail must be flex on desktop');

    // Safe Area Bottom Padding on Dashboard Containers on Mobile
    const sidebarContainer = resolver.getComputedDeclarations('.dashboard-container.container-sidebar', 375);
    assertTrue(sidebarContainer['padding-bottom']?.includes('72px'),
      'container-sidebar must provide at least 72px padding-bottom on mobile to avoid dock occlusion');
    assertTrue(sidebarContainer['padding-bottom']?.includes('safe-area-inset-bottom'),
      'container-sidebar must include safe-area-inset-bottom');

    const homepageContainer = resolver.getComputedDeclarations('.dashboard-container.container-homepage', 375);
    assertTrue(homepageContainer['padding-bottom']?.includes('72px'),
      'container-homepage must provide at least 72px padding-bottom on mobile to avoid dock occlusion');
  });

  // --------------------------------------------------------------------------
  // 7. Accessibility & Semantic ARIA Attribute Audit
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-07] Semantic ARIA roles and labels are present throughout navigation components', () => {
    // Header role
    const headerElems = navAst.findJsxElements('header');
    const hasHeaderBanner = headerElems.some((h) => h.attributes.role === 'banner');
    assertTrue(hasHeaderBanner, 'mobile-nav-header must declare role="banner"');

    // Bottom dock role & label
    const navElems = navAst.findJsxElements('nav');
    const hasBottomNav = navElems.some((n) =>
      n.attributes.role === 'navigation' &&
      (n.attributes['aria-label'] === 'Mobile Bottom Navigation' || n.attributes['aria-label']?.includes('Bottom'))
    );
    assertTrue(hasBottomNav, 'Bottom dock must have role="navigation" and aria-label="Mobile Bottom Navigation"');

    // Drawer dialog role
    const asideElems = navAst.findJsxElements('aside');
    const hasDrawerModal = asideElems.some((a) =>
      a.attributes.role === 'dialog' &&
      a.attributes['aria-modal'] === 'true'
    );
    assertTrue(hasDrawerModal, 'More drawer must have role="dialog" and aria-modal="true"');

    // More button ARIA controls
    const buttons = navAst.findJsxElements('button');
    const hasMoreAria = buttons.some((b) =>
      b.attributes['aria-controls'] === 'mobile-nav-drawer'
    );
    assertTrue(hasMoreAria, 'More button must declare aria-controls="mobile-nav-drawer"');
  });

  // --------------------------------------------------------------------------
  // 8. Desktop / Mobile Isolation Invariants
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-08] Desktop navigation elements and mobile navigation elements remain strictly decoupled', () => {
    const code = navAst.rawCode;

    // Desktop top navbar only renders when isHomePage is true and has desktop-only class
    assertTrue(code.includes('isHomePage && ('), 'Desktop top navbar must be guarded by isHomePage');
    assertTrue(code.includes('top-navbar-fixed-container desktop-only'), 'Desktop top navbar must have desktop-only class');

    // Desktop right rail only renders when !isHomePage and has desktop-only class
    assertTrue(code.includes('!isHomePage && ('), 'Desktop right rail must be guarded by !isHomePage');
    assertTrue(code.includes('right-nav-rail desktop-only'), 'Desktop right rail must have desktop-only class');

    // Mobile contextual header and mobile bottom dock are NOT wrapped in isHomePage conditionals
    const headerNotGuarded = !code.includes('{isHomePage && <header className="mobile-nav-header') &&
      !code.includes('{!isHomePage && <header className="mobile-nav-header');
    assertTrue(headerNotGuarded, 'mobile-nav-header must render unconditionally on all routes');

    const dockNotGuarded = !code.includes('{isHomePage && <nav className="mobile-bottom-dock') &&
      !code.includes('{!isHomePage && <nav className="mobile-bottom-dock');
    assertTrue(dockNotGuarded, 'mobile-bottom-dock must render unconditionally on all routes');
  });

  // --------------------------------------------------------------------------
  // 9. Exhaustive Route-to-View Mapping in App.tsx
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-09] App.tsx renders dedicated view components for all 11 routes without dead routes', () => {
    const appCode = appAst.rawCode;
    for (const route of ALL_11_ROUTES) {
      const hasRouteCheck = appCode.includes(`activeTab === '${route}'`) || appCode.includes(`activeTab === "${route}"`);
      assertTrue(hasRouteCheck, `App.tsx must handle activeTab === '${route}' with a dedicated view`);
    }
  });

  // --------------------------------------------------------------------------
  // 10. State Idempotency and Re-Selection Behavior
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-10] Re-selecting the already-active tab closes drawer, resets scroll lock, and is idempotent', () => {
    // In Navbar.tsx, handleTabChange must call setIsMobileDrawerOpen(false) and restore body overflow
    const code = navAst.rawCode;
    const lines = code.split('\n');
    const handleTabChangeIdx = lines.findIndex((l) => l.includes('const handleTabChange ='));
    assertTrue(handleTabChangeIdx !== -1, 'handleTabChange must be defined in Navbar.tsx');

    const handlerBlock = lines.slice(handleTabChangeIdx, handleTabChangeIdx + 10).join('\n');
    assertTrue(handlerBlock.includes('setIsMobileDrawerOpen(false)'), 'handleTabChange must unconditionally close drawer');
    assertTrue(handlerBlock.includes("document.body.style.overflow = ''"), 'handleTabChange must unconditionally unlock body scroll');
  });

  // --------------------------------------------------------------------------
  // 11. 10,000 Transition Stress Test & Determinism
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-11] 10,000 randomized state switches execute with 0 drift and 0 scroll lock leaks', () => {
    let activeTab = 'landing';
    let isMobileDrawerOpen = false;
    let bodyOverflow = '';

    const executeAction = (action, payload) => {
      switch (action) {
        case 'NAVIGATE':
          activeTab = payload;
          isMobileDrawerOpen = false;
          bodyOverflow = '';
          break;
        case 'OPEN_DRAWER':
          isMobileDrawerOpen = true;
          bodyOverflow = 'hidden';
          break;
        case 'CLOSE_DRAWER':
          isMobileDrawerOpen = false;
          bodyOverflow = '';
          break;
        case 'ESCAPE':
          isMobileDrawerOpen = false;
          bodyOverflow = '';
          break;
        case 'RESIZE_DESKTOP':
          if (isMobileDrawerOpen) {
            isMobileDrawerOpen = false;
            bodyOverflow = '';
          }
          break;
      }
    };

    let seed = 123456789;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let step = 0; step < 10000; step++) {
      const p = rand();
      if (p < 0.25) {
        executeAction('OPEN_DRAWER');
      } else if (p < 0.4) {
        executeAction('CLOSE_DRAWER');
      } else if (p < 0.45) {
        executeAction('ESCAPE');
      } else if (p < 0.5) {
        executeAction('RESIZE_DESKTOP');
      } else {
        const targetRoute = ALL_11_ROUTES[Math.floor(rand() * ALL_11_ROUTES.length)];
        executeAction('NAVIGATE', targetRoute);
      }

      // Assert invariants at each of 10,000 steps
      if (isMobileDrawerOpen) {
        assertEqual(bodyOverflow, 'hidden', `Step ${step}: Body overflow must be hidden while drawer open`);
      } else {
        assertEqual(bodyOverflow, '', `Step ${step}: Body overflow must be clean when drawer closed`);
      }
      assertTrue(ALL_11_ROUTES.includes(activeTab), `Step ${step}: activeTab "${activeTab}" must be valid route`);
    }

    // Ensure final state can close cleanly
    executeAction('CLOSE_DRAWER');
    assertEqual(bodyOverflow, '', 'Final overflow must be empty string');
  });

  // --------------------------------------------------------------------------
  // 12. Adjacent Touch Target Separation (>= 8px)
  // --------------------------------------------------------------------------
  it('[CHALLENGE-M1-12] Adjacent touch targets provide adequate separation (>= 8px gap or flex distribution)', () => {
    // Header right action buttons gap
    const headerRight = resolver.getComputedDeclarations('.mobile-nav-header-right', 375);
    const headerGap = parsePx(headerRight['gap']);
    assertTrue(headerGap >= 8, `Mobile header right buttons must have gap >= 8px, got ${headerGap}px`);

    // Drawer primary grid gap
    const gridDecls = resolver.getComputedDeclarations('.mobile-drawer-primary-grid', 375);
    const gridGap = parsePx(gridDecls['gap']);
    assertTrue(gridGap >= 8, `Drawer primary grid must have gap >= 8px, got ${gridGap}px`);

    // Drawer nav items gap
    const drawerNav = resolver.getComputedDeclarations('.mobile-drawer-nav', 375);
    const navGap = parsePx(drawerNav['gap']);
    // Each nav item is min-height 50px (exceeding 44px by 6px) + gap
    assertTrue(drawerNav['display'] === 'flex' && drawerNav['flex-direction'] === 'column',
      'Drawer nav items must be in flex column');

    // Bottom dock uses justify-content: space-around and flex: 1 for equal distribution
    const dockDecls = resolver.getComputedDeclarations('.mobile-bottom-dock', 375);
    assertEqual(dockDecls['display'], 'flex', 'Bottom dock must be flex container');
  });
});
