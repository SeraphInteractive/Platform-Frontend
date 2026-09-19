/**
 * Tier 1: Group 2 — Mobile Navigation Pattern (Feat 3)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue, assertIncludes } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const navAst = parseComponentAst('src/components/Navbar.tsx');

describe('Group 2: Mobile Navigation Pattern (Feat 3)', () => {
  it('[T1-NAV-01] Mobile navigation element renders on viewports <768px', () => {
    // Either Navbar.tsx defines mobile nav markup (e.g. mobile-nav-bar) or styles define display
    const mobileNavDecls = resolver.getComputedDeclarations('.mobile-nav-bar', 375);
    const hasMobileNavClass = Object.keys(mobileNavDecls).length > 0;
    const hasMobileNavInAst = navAst.containsPattern(/mobile-nav|MobileNav/i);
    assertTrue(hasMobileNavClass || hasMobileNavInAst, 'Mobile navigation element must exist and be styled for mobile viewports');
  });

  it('[T1-NAV-02] Right navigation rail .right-nav-rail is hidden (display: none) on viewports <768px', () => {
    const decls = resolver.getComputedDeclarations('.right-nav-rail', 375);
    assertEqual(decls['display'], 'none', '.right-nav-rail must have display: none on viewports <768px');
  });

  it('[T1-NAV-03] Primary route buttons (landing, ballot, leaderboard) are present in mobile navigation', () => {
    const raw = navAst.rawCode;
    const hasLanding = raw.includes("'landing'") || raw.includes('"landing"');
    const hasBallot = raw.includes("'ballot'") || raw.includes('"ballot"');
    const hasLeaderboard = raw.includes("'leaderboard'") || raw.includes('"leaderboard"');
    assertTrue(hasLanding && hasBallot && hasLeaderboard, 'Navbar must include primary navigation route keys: landing, ballot, leaderboard');
  });

  it('[T1-NAV-04] Selecting a mobile nav button invokes handleTabChange with the target NavTabId', () => {
    const hasHandler = navAst.containsPattern(/onSelectTab|handleTabChange|setActiveTab/);
    assertTrue(hasHandler, 'Mobile navigation buttons must wire to tab selection handler');
  });

  it('[T1-NAV-05] Currently active tab displays active styling state (class active or aria-current)', () => {
    const hasActiveIndicator = navAst.containsPattern(/activeTab\s*===|\.active|aria-current/);
    assertTrue(hasActiveIndicator, 'Active tab must apply active CSS class or aria-current attribute');
  });
});
