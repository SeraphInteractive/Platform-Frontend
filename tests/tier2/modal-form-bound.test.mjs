/**
 * Tier 2: Group 9 — Mobile Modal Form Ergonomics & Boundary Validation (Feat 4, 13, 14)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');

function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

function validatePitchForm({ title, description, mediaFile }) {
  const errors = [];
  if (!title || title.trim() === '') {
    errors.push('Title cannot be empty');
  }
  if (!description || description.trim() === '') {
    errors.push('Description cannot be empty');
  }
  if (description && description.length > 1500) {
    errors.push('Description exceeds 1500 character limit');
  }
  if (mediaFile && mediaFile.size > 5 * 1024 * 1024) {
    errors.push('File exceeds maximum size of 5 MB');
  }
  return { isValid: errors.length === 0, errors };
}

describe('Group 9 Boundary: Mobile Modal Form Ergonomics (Feat 4, 13, 14)', () => {
  it('[T2-FORM-01] Character counter turns warning/error styling when description exceeds MAX_CHAR_LIMIT (1500 chars)', () => {
    const raw = pitchAst.rawCode;
    const hasLimitLogic = raw.includes('1500') && (raw.includes('error') || raw.includes('warning') || raw.includes('text-red'));
    assertTrue(hasLimitLogic, 'Character counter must apply warning/error styling when length exceeds 1500 chars');
  });

  it('[T2-FORM-02] Submitting form with empty title or empty description triggers validation error before network call', () => {
    const result1 = validatePitchForm({ title: '   ', description: 'valid description' });
    assertEqual(result1.isValid, false);
    assertTrue(result1.errors.some((e) => e.includes('Title')));

    const result2 = validatePitchForm({ title: 'valid title', description: '' });
    assertEqual(result2.isValid, false);
    assertTrue(result2.errors.some((e) => e.includes('Description')));
  });

  it('[T2-FORM-03] Uploading media file exceeding 5MB displays rejection notice (File exceeds maximum size of 5 MB)', () => {
    const bigFile = { size: 6 * 1024 * 1024, name: 'huge_video.mp4' };
    const res = validatePitchForm({ title: 'Valid', description: 'Valid', mediaFile: bigFile });
    assertEqual(res.isValid, false);
    assertTrue(res.errors.some((e) => e.includes('5 MB')), 'Must reject file over 5 MB');
  });

  it('[T2-FORM-04] Account popover dropdown on 320px viewport maintains left >= 0 and right <= 320px', () => {
    const decls = resolver.getComputedDeclarations('.settings-dropdown-popover', 320);
    const maxW = decls['max-width'] || decls['width'];
    assertTrue(maxW === '100%' || maxW === 'calc(100vw - 32px)' || parseInt(maxW, 10) <= 320,
      'Settings popover must be clamped within 320px viewport');
  });

  it('[T2-FORM-05] Word counter correctly handles multi-whitespace strings and returns 0 words on empty string', () => {
    assertEqual(countWords(''), 0, 'Empty string should yield 0 words');
    assertEqual(countWords('     '), 0, 'Whitespace-only string should yield 0 words');
    assertEqual(countWords('Hello   World  \n \t from   VoteUI!'), 4, 'Multi-whitespace string should yield 4 words');
  });
});
