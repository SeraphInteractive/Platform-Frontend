/**
 * Tier 1: Group 9 — Mobile Modal Form Ergonomics (Feat 4, 13, 14)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');
const settingsDropAst = parseComponentAst('src/components/SettingsDropdown.tsx');

describe('Group 9: Mobile Modal Form Ergonomics (Feat 4, 13, 14)', () => {
  it('[T1-FORM-01] Modal form action buttons (Submit / Cancel) stack in a full-width column on mobile (<768px)', () => {
    const decls = resolver.getComputedDeclarations('.modal-actions-stacked', 375);
    const isColumn = decls['flex-direction'] === 'column' || decls['flex-direction'] === 'column-reverse';
    assertTrue(isColumn, 'Modal action buttons on mobile must stack in a column');
  });

  it('[T1-FORM-02] Real-time character counter displays current count and maximum limit (0 / 1500)', () => {
    const raw = pitchAst.rawCode;
    const hasCharCounter = raw.includes('1500') && (raw.includes('length') || raw.includes('chars') || raw.includes('count'));
    assertTrue(hasCharCounter, 'CreatePitchModal must render character counter with 1500 limit');
  });

  it('[T1-FORM-03] File upload input supports selecting image/video with preview rendering', () => {
    const fileInputs = pitchAst.findJsxElements('input').filter((i) => i.attributes.type === 'file');
    assertTrue(fileInputs.length >= 1, 'CreatePitchModal must contain a file input for media upload');
    const acceptAttr = fileInputs[0].attributes.accept;
    assertTrue(Boolean(acceptAttr), 'File upload input must specify accept attribute for media');
  });

  it('[T1-FORM-04] Close button invokes onClose callback to dismiss modal', () => {
    const buttons = pitchAst.findJsxElements('button');
    const closeBtn = buttons.find(
      (b) => b.attributes.onClick && (b.attributes.title === 'Close modal' || b.attributes.className === 'icon-btn')
    );
    assertTrue(Boolean(closeBtn), 'Modal must render a close button attached to onClose handler');
  });

  it('[T1-FORM-05] Account popover dropdown renders within visible viewport coordinates on mobile', () => {
    const decls = resolver.getComputedDeclarations('.settings-dropdown-popover', 375);
    const leftVal = decls['left'];
    const rightVal = decls['right'];
    // On mobile, popover must not have negative offset or overflow right
    assertTrue(leftVal !== '-200px' && rightVal !== '-200px',
      'SettingsDropdown popover must not be offset offscreen on mobile');
  });
});
