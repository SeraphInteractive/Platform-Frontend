/**
 * Tier 1: Group 1 — Responsive Breakpoints & Layout Architecture (Feat 2, 23)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';

const resolver = createCssResolver('src/styles.css');

describe('Group 1: Responsive Breakpoints & Layout Architecture (Feat 2, 23)', () => {
  it('[T1-RESP-01] Standard mobile media query @media (max-width: 767px) is defined in src/styles.css', () => {
    const hasMobileQuery = resolver.hasMediaQuery(/max-width:\s*767px/);
    assertTrue(hasMobileQuery, 'styles.css must define standard mobile breakpoint @media (max-width: 767px)');
  });

  it('[T1-RESP-02] Tablet media query @media (min-width: 768px) is defined in src/styles.css', () => {
    const hasTabletQuery = resolver.hasMediaQuery(/min-width:\s*768px/);
    assertTrue(hasTabletQuery, 'styles.css must define standard tablet breakpoint @media (min-width: 768px)');
  });

  it('[T1-RESP-03] Desktop media query @media (min-width: 1024px) is defined in src/styles.css', () => {
    const hasDesktopQuery = resolver.hasMediaQuery(/min-width:\s*1024px/);
    assertTrue(hasDesktopQuery, 'styles.css must define standard desktop breakpoint @media (min-width: 1024px)');
  });

  it('[T1-RESP-04] .layout-with-sidebar applies flex-direction: row on desktop (>=1024px)', () => {
    const decls = resolver.getComputedDeclarations('.layout-with-sidebar', 1200);
    const flexDir = decls['flex-direction'] || (decls['display'] === 'flex' ? 'row' : undefined);
    assertEqual(flexDir, 'row', '.layout-with-sidebar must declare flex-direction: row at >=1024px');
  });

  it('[T1-RESP-05] .layout-with-sidebar applies flex-direction: column on mobile (<768px)', () => {
    const decls = resolver.getComputedDeclarations('.layout-with-sidebar', 375);
    assertEqual(decls['flex-direction'], 'column', '.layout-with-sidebar must declare flex-direction: column at <768px');
  });
});
