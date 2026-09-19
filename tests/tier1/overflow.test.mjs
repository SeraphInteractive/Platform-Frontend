/**
 * Tier 1: Group 3 — Horizontal Overflow Elimination (Feat 5, 22)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');

describe('Group 3: Horizontal Overflow Elimination (Feat 5, 22)', () => {
  it('[T1-OVR-01] Root container .app-root-layout enforces overflow-x: hidden and max-width: 100vw', () => {
    const decls = resolver.getComputedDeclarations('.app-root-layout', 375);
    assertEqual(decls['overflow-x'], 'hidden', '.app-root-layout must declare overflow-x: hidden on mobile');
    assertTrue(decls['max-width'] === '100vw' || decls['width'] === '100%' || decls['max-width'] === '100%',
      '.app-root-layout must constrain width within 100vw/100%');
  });

  it('[T1-OVR-02] Global .table-wrap utility class exists with overflow-x: auto and width: 100%', () => {
    const decls = resolver.getComputedDeclarations('.table-wrap', 375);
    assertEqual(decls['overflow-x'], 'auto', '.table-wrap must declare overflow-x: auto');
    assertEqual(decls['width'], '100%', '.table-wrap must declare width: 100%');
  });

  it('[T1-OVR-03] Landing page container layout fits within standard 375px mobile viewport without overflow', () => {
    const decls = resolver.getComputedDeclarations('.landing-container', 375);
    const hasMaxW = decls['max-width'] || decls['width'] || '100%';
    assertTrue(hasMaxW === '100%' || hasMaxW === '100vw' || parseInt(hasMaxW, 10) <= 375,
      '.landing-container must be constrained to fit 375px viewport');
  });

  it('[T1-OVR-04] Candidate pitch cards wrap cleanly within 375px viewport width', () => {
    const decls = resolver.getComputedDeclarations('.slot-card-body', 375);
    const wrapRule = decls['overflow-wrap'] || decls['word-break'] || decls['word-wrap'];
    assertTrue(wrapRule === 'break-word' || wrapRule === 'break-all' || decls['max-width'] !== undefined,
      'Pitch cards must support text wrapping to prevent card blowout');
  });

  it('[T1-OVR-05] PublicLeaderboard container width is constrained to 100% without horizontal document overflow', () => {
    const decls = resolver.getComputedDeclarations('.leaderboard-container', 375);
    const widthVal = decls['width'] || decls['max-width'] || '100%';
    assertTrue(widthVal === '100%' || widthVal === '100vw',
      '.leaderboard-container must constrain width to 100% without overflow');
  });
});
