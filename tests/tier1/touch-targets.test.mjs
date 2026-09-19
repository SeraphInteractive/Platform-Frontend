/**
 * Tier 1: Group 7 — 44×44px Touch Target Compliance (Feat 9, 13, 20)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue, assertGreaterThanOrEqual } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');

function parsePxValue(val) {
  if (!val) return 0;
  const m = String(val).match(/([\d.]+)px/);
  return m ? parseFloat(m[1]) : 0;
}

describe('Group 7: 44×44px Touch Target Compliance (Feat 9, 13, 20)', () => {
  it('[T1-TOUCH-01] Mobile navigation items have minimum dimensions of 44×44px (or padding area >=44px)', () => {
    const navItem = resolver.getComputedDeclarations('.mobile-nav-item', 375);
    const minH = parsePxValue(navItem['min-height'] || navItem['height']);
    const minW = parsePxValue(navItem['min-width'] || navItem['width']);
    const hasSufficientArea = (minH >= 44 && minW >= 44) || navItem['padding'] !== undefined;
    assertTrue(hasSufficientArea, 'Mobile nav items must have minimum 44x44px touch area or adequate touch padding');
  });

  it('[T1-TOUCH-02] Clear slot buttons on filled ballot slots declare min-width: 44px; min-height: 44px', () => {
    const clearBtn = resolver.getComputedDeclarations('.slot-clear-btn', 375);
    const minW = parsePxValue(clearBtn['min-width']);
    const minH = parsePxValue(clearBtn['min-height']);
    assertTrue(minW >= 44 && minH >= 44, `Clear slot button must declare min-width and min-height >= 44px, found ${minW}x${minH}px`);
  });

  it('[T1-TOUCH-03] Up/Down reorder chevrons on ballot slots provide minimum 44×44px tappable target area', () => {
    const chevronBtn = resolver.getComputedDeclarations('.slot-reorder-btn', 375);
    const minW = parsePxValue(chevronBtn['min-width'] || chevronBtn['width']);
    const minH = parsePxValue(chevronBtn['min-height'] || chevronBtn['height']);
    assertTrue(minW >= 44 && minH >= 44, `Slot reorder chevron must have min-width and min-height >= 44px, found ${minW}x${minH}px`);
  });

  it('[T1-TOUCH-04] Modal close button (.icon-btn or close trigger) provides minimum 44×44px touch area', () => {
    // Check CSS declarations for modal close button
    const closeBtnDecls = resolver.getComputedDeclarations('.modal-close-btn', 375);
    const minW = parsePxValue(closeBtnDecls['min-width'] || closeBtnDecls['width']);
    const minH = parsePxValue(closeBtnDecls['min-height'] || closeBtnDecls['height']);

    // Also check JSX AST that it does not hardcode sub-44px inline style
    const buttons = pitchAst.findJsxElements('button');
    let hasSub44Inline = false;
    for (const btn of buttons) {
      if (btn.attributes.title === 'Close modal' || btn.attributes.className === 'icon-btn') {
        const style = btn.attributes.style;
        if (style && style.properties) {
          for (const p of style.properties) {
            if ((p.key?.name === 'width' || p.key?.name === 'height') && p.value?.value < 44) {
              hasSub44Inline = true;
            }
          }
        }
      }
    }
    assertTrue((minW >= 44 && minH >= 44) && !hasSub44Inline,
      'Modal close button must provide minimum 44x44px touch dimensions without sub-44px inline overrides');
  });

  it('[T1-TOUCH-05] Primary action buttons (Cast Ballot, Submit Pitch) have minimum height >=44px', () => {
    const btnDecls = resolver.getComputedDeclarations('.btn-primary', 375);
    const minH = parsePxValue(btnDecls['min-height'] || btnDecls['height']);
    assertTrue(minH >= 44, `Primary buttons must provide min-height >= 44px, found ${minH}px`);
  });
});
