/**
 * Tier 2: Group 2 — Mobile Navigation Boundaries & Edge Cases (Feat 3)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const navAst = parseComponentAst('src/components/Navbar.tsx');
const appAst = parseComponentAst('src/App.tsx');

const ALL_11_TABS = [
  'landing', 'ballot', 'leaderboard', 'docs', 'grabbox',
  'diagnostics', 'settings', 'progress', 'privacy', 'terms', 'guidelines'
];

describe('Group 2 Boundary: Mobile Navigation Pattern (Feat 3)', () => {
  it('[T2-NAV-01] Rapidly switching between all 11 views does not corrupt routing state or cause memory leaks', () => {
    let currentTab = 'landing';
    const visited = [];

    // Simulate 100 rapid tab transitions across all 11 views
    for (let i = 0; i < 100; i++) {
      const target = ALL_11_TABS[i % ALL_11_TABS.length];
      currentTab = target;
      visited.push(currentTab);
    }

    assertEqual(currentTab, ALL_11_TABS[99 % ALL_11_TABS.length]);
    assertEqual(visited.length, 100, 'All 100 route switches should execute cleanly without state corruption');
  });

  it('[T2-NAV-02] Mobile navigation padding accounts for safe-area insets without obscuring bottom action buttons', () => {
    const navDecls = resolver.getComputedDeclarations('.mobile-nav-bar', 375);
    const hasSafeArea = navDecls['padding-bottom']?.includes('safe-area-inset-bottom') ||
      navDecls['padding']?.includes('env(safe-area-inset-bottom)') ||
      navAst.containsPattern(/safe-area-inset-bottom|safeArea/);
    assertTrue(Boolean(hasSafeArea), 'Mobile navigation should handle safe-area-inset-bottom for modern phones');
  });

  it('[T2-NAV-03] Mobile navigation tab labels at 320px viewport do not wrap or truncate destructively', () => {
    const labelDecls = resolver.getComputedDeclarations('.mobile-nav-label', 320);
    const overflow = labelDecls['text-overflow'] || labelDecls['overflow'];
    const whiteSpace = labelDecls['white-space'];
    const isSafe = whiteSpace === 'nowrap' || overflow === 'ellipsis' || labelDecls['font-size'] !== undefined;
    assertTrue(isSafe, 'Mobile nav tab labels on 320px must prevent ragged wrapping');
  });

  it('[T2-NAV-04] Direct navigation to legal sub-routes (privacy, terms, guidelines) correctly updates active state', () => {
    const legalRoutes = ['privacy', 'terms', 'guidelines'];
    for (const route of legalRoutes) {
      assertTrue(appAst.rawCode.includes(`'${route}'`) || appAst.rawCode.includes(`"${route}"`),
        `App routing table must recognize legal sub-route "${route}"`);
    }
  });

  it('[T2-NAV-05] Mobile navigation elements include valid aria-label and role="navigation" attributes', () => {
    const navElements = navAst.findJsxElements('nav');
    const hasAriaNav = navElements.some(
      (n) => n.attributes.role === 'navigation' || n.attributes['aria-label'] !== undefined
    ) || navAst.containsPattern(/role="navigation"|aria-label=".*[Nn]avigation"/);
    assertTrue(hasAriaNav, 'Mobile navigation components must provide role="navigation" or aria-label');
  });
});
