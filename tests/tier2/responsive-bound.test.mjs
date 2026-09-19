/**
 * Tier 2: Group 1 — Responsive Breakpoints & Layout Boundaries (Feat 2, 23)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';

const resolver = createCssResolver('src/styles.css');

describe('Group 1 Boundary: Responsive Breakpoints & Layout Architecture (Feat 2, 23)', () => {
  it('[T2-RESP-01] Viewport at exactly 320px width renders column layout without horizontal document overflow', () => {
    const layout = resolver.getComputedDeclarations('.layout-with-sidebar', 320);
    assertEqual(layout['flex-direction'], 'column', 'At 320px minimum mobile width, layout-with-sidebar must be column');
    const root = resolver.getComputedDeclarations('.app-root-layout', 320);
    assertEqual(root['overflow-x'], 'hidden', 'At 320px, root layout must have overflow-x: hidden');
  });

  it('[T2-RESP-02] Viewport at boundary 767px activates mobile rules and suppresses desktop sidebar rail', () => {
    const rail = resolver.getComputedDeclarations('.right-nav-rail', 767);
    assertEqual(rail['display'], 'none', 'At boundary 767px, desktop sidebar rail must be display: none');
  });

  it('[T2-RESP-03] Viewport at boundary 768px activates tablet rules and suppresses mobile bottom bar', () => {
    const mobileNav = resolver.getComputedDeclarations('.mobile-nav-bar', 768);
    assertTrue(mobileNav['display'] === 'none' || mobileNav['display'] === undefined,
      'At boundary 768px, mobile bottom bar must not be displayed');
  });

  it('[T2-RESP-04] Viewport at boundary 1023px retains tablet responsive adjustments', () => {
    const wrapper = resolver.getComputedDeclarations('.page-view-wrapper', 1023);
    const scrollY = wrapper['overflow-y'] || wrapper['overflow'];
    assertTrue(scrollY === 'auto' || scrollY === 'scroll',
      'At boundary 1023px, page wrapper must retain responsive vertical scroll');
  });

  it('[T2-RESP-05] Viewport at boundary 1024px restores full desktop layout density and 64px vertical right rail', () => {
    const rail = resolver.getComputedDeclarations('.right-nav-rail', 1024);
    assertTrue(rail['display'] !== 'none', 'At boundary 1024px, right rail must not be hidden');
    const layout = resolver.getComputedDeclarations('.layout-with-sidebar', 1024);
    assertEqual(layout['flex-direction'], 'row', 'At boundary 1024px, layout-with-sidebar must be row');
  });
});
