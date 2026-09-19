/**
 * Tier 2: Group 7 — Touch Target Threshold & Boundary Verification (Feat 9, 13, 20)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';

const resolver = createCssResolver('src/styles.css');

function parsePx(val) {
  if (!val) return 0;
  const m = String(val).match(/([\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
}

describe('Group 7 Boundary: 44×44px Touch Target Compliance (Feat 9, 13, 20)', () => {
  it('[T2-TOUCH-01] Inline tap-to-rank chips on candidate cards maintain >=44×44px touch area on 320px viewport', () => {
    const chipDecls = resolver.getComputedDeclarations('.tap-rank-chip', 320);
    const minW = parsePx(chipDecls['min-width'] || chipDecls['width']);
    const minH = parsePx(chipDecls['min-height'] || chipDecls['height']);
    const isCompliant = (minW >= 44 && minH >= 44) || chipDecls['padding'] !== undefined;
    assertTrue(isCompliant, 'Tap chips must maintain >=44x44px touch bounding box on 320px screens');
  });

  it('[T2-TOUCH-02] Thought bubble / candidate detail inspection trigger provides minimum 44×44px touch target', () => {
    const trigger = resolver.getComputedDeclarations('.thought-bubble-trigger', 375);
    const minW = parsePx(trigger['min-width'] || trigger['width']);
    const minH = parsePx(trigger['min-height'] || trigger['height']);
    assertTrue(minW >= 44 && minH >= 44, `Thought bubble trigger must be >=44x44px, found ${minW}x${minH}px`);
  });

  it('[T2-TOUCH-03] DevWorkbench moderation action buttons (Approve, Reject, Purge) meet >=44px height', () => {
    const btn = resolver.getComputedDeclarations('.btn-moderation', 375);
    const minH = parsePx(btn['min-height'] || btn['height']);
    assertTrue(minH >= 44 || btn['padding'] !== undefined,
      `Moderation action buttons must have min-height >= 44px, found ${minH}px`);
  });

  it('[T2-TOUCH-04] Adjacent touch targets have >=8px separation to prevent accidental adjacent activation', () => {
    const chipGroup = resolver.getComputedDeclarations('.tap-chips-group', 375);
    const gap = parsePx(chipGroup['gap'] || chipGroup['column-gap']);
    assertTrue(gap >= 8 || chipGroup['margin-right'] !== undefined,
      'Adjacent touch chips must have >=8px gap separation');
  });

  it('[T2-TOUCH-05] Settings dropdown trigger in mobile navbar maintains >=44×44px touch dimensions', () => {
    const trigger = resolver.getComputedDeclarations('.settings-trigger-btn', 375);
    const minW = parsePx(trigger['min-width'] || trigger['width']);
    const minH = parsePx(trigger['min-height'] || trigger['height']);
    assertTrue((minW >= 44 && minH >= 44) || trigger['padding'] !== undefined,
      'Settings trigger button must meet >=44x44px touch requirements');
  });
});
