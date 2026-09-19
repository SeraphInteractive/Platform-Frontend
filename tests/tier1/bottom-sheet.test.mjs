/**
 * Tier 1: Group 8 — Mobile Bottom Sheet Dialogs (Feat 12, 14)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');

describe('Group 8: Mobile Bottom Sheet Dialogs (Feat 12, 14)', () => {
  it('[T1-SHEET-01] CreatePitchModal applies .modal-sheet-mobile styling on viewports <768px', () => {
    const decls = resolver.getComputedDeclarations('.modal-sheet-mobile', 375);
    const isStyled = Object.keys(decls).length > 0;
    assertTrue(isStyled, '.modal-sheet-mobile rules must be defined for mobile viewports');
  });

  it('[T1-SHEET-02] Mobile bottom sheet renders a top drag handle/pill (.modal-drag-pill)', () => {
    let hasDragPill = false;
    pitchAst.walk((node) => {
      if (node.type === 'JSXElement') {
        const clsAttr = node.openingElement.attributes.find((a) => a.name?.name === 'className');
        if (clsAttr?.value?.value?.includes('modal-drag-pill')) {
          hasDragPill = true;
        }
      }
    });
    assertTrue(hasDragPill, 'CreatePitchModal must render .modal-drag-pill element');
  });

  it('[T1-SHEET-03] Mobile bottom sheet is anchored to bottom of viewport (bottom: 0)', () => {
    const decls = resolver.getComputedDeclarations('.modal-sheet-mobile', 375);
    const isAnchored = decls['bottom'] === '0' || decls['bottom'] === '0px' || decls['align-self'] === 'flex-end';
    assertTrue(isAnchored, '.modal-sheet-mobile must anchor to bottom of viewport');
  });

  it('[T1-SHEET-04] Mobile bottom sheet features top-left and top-right border radiuses (border-top-left-radius)', () => {
    const decls = resolver.getComputedDeclarations('.modal-sheet-mobile', 375);
    const hasTopRadius = decls['border-top-left-radius'] !== undefined ||
      (decls['border-radius'] && !decls['border-radius'].startsWith('0'));
    assertTrue(hasTopRadius, '.modal-sheet-mobile must specify top corner border radiuses');
  });

  it('[T1-SHEET-05] Mobile bottom sheet restricts max height to 85vh with inner vertical scrolling (overflow-y: auto)', () => {
    const decls = resolver.getComputedDeclarations('.modal-sheet-mobile', 375);
    assertEqual(decls['max-height'], '85vh', '.modal-sheet-mobile must have max-height: 85vh');
    const scrollY = decls['overflow-y'] || decls['overflow'];
    assertTrue(scrollY === 'auto' || scrollY === 'scroll', '.modal-sheet-mobile must have inner vertical scrolling');
  });
});
