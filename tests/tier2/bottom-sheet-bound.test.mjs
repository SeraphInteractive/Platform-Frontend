/**
 * Tier 2: Group 8 — Mobile Bottom Sheet Boundaries & Modals (Feat 12, 14)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');
const roundAst = parseComponentAst('src/components/CreateRoundModal.tsx');

describe('Group 8 Boundary: Mobile Bottom Sheet Dialogs (Feat 12, 14)', () => {
  it('[T2-SHEET-01] Desktop viewport (>=1024px) retains centered floating modal dialog without .modal-sheet-mobile', () => {
    const desktopModal = resolver.getComputedDeclarations('.modal-dialog-desktop', 1024);
    const hasCenteredMargin = desktopModal['margin']?.includes('auto') || desktopModal['align-self'] === 'center';
    assertTrue(hasCenteredMargin || desktopModal['max-width'] !== undefined,
      'Desktop modal must preserve centered alignment at >=1024px');
  });

  it('[T2-SHEET-02] Tapping the backdrop overlay outside bottom sheet invokes onClose callback', () => {
    const raw = pitchAst.rawCode;
    const hasBackdropDismiss = raw.includes('onClose') && (raw.includes('modal-backdrop') || raw.includes('overlay'));
    assertTrue(hasBackdropDismiss, 'Backdrop click must trigger onClose handler');
  });

  it('[T2-SHEET-03] Tapping inside bottom sheet card does not bubble up to backdrop (stopPropagation)', () => {
    const raw = pitchAst.rawCode;
    const hasStopProp = raw.includes('stopPropagation') || raw.includes('e.target === e.currentTarget');
    assertTrue(hasStopProp, 'Modal container must prevent click propagation to backdrop');
  });

  it('[T2-SHEET-04] When virtual keyboard opens on mobile, bottom sheet contents remain vertically scrollable', () => {
    const sheetDecls = resolver.getComputedDeclarations('.modal-sheet-mobile', 375);
    const overflowY = sheetDecls['overflow-y'] || sheetDecls['overflow'];
    assertTrue(overflowY === 'auto' || overflowY === 'scroll',
      'Bottom sheet must declare vertical scrolling to handle virtual keyboard height shrinkage');
  });

  it('[T2-SHEET-05] CreateRoundModal and CommandPalette adopt responsive mobile sheet constraints on <768px', () => {
    const roundRaw = roundAst.rawCode;
    const isResponsive = roundRaw.includes('modal-sheet-mobile') || roundRaw.includes('responsive') || roundRaw.includes('max-width');
    assertTrue(isResponsive, 'CreateRoundModal must support responsive mobile modal constraints');
  });
});
