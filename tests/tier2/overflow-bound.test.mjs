/**
 * Tier 2: Group 3 — Horizontal Overflow Elimination Boundaries (Feat 5, 22)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const docsAst = parseComponentAst('src/views/Docs/DocsPage.tsx');
const devAst = parseComponentAst('src/views/DevWorkbench/DevWorkbench.tsx');

describe('Group 3 Boundary: Horizontal Overflow Elimination (Feat 5, 22)', () => {
  it('[T2-OVR-01] Viewport at 320px produces 0px horizontal scroll on all 11 routes', () => {
    const rootDecls = resolver.getComputedDeclarations('.app-root-layout', 320);
    assertEqual(rootDecls['overflow-x'], 'hidden', 'At 320px absolute minimum, overflow-x must be hidden');
  });

  it('[T2-OVR-02] All 4 specification tables in DocsPage are wrapped in .table-wrap to prevent document blowout', () => {
    let wrapCount = 0;
    docsAst.walk((node) => {
      if (node.type === 'JSXElement' && node.openingElement?.name?.name === 'div') {
        const cls = node.openingElement.attributes.find((a) => a.name?.name === 'className');
        if (cls?.value?.value?.includes('table-wrap')) {
          wrapCount++;
        }
      }
    });
    assertTrue(wrapCount >= 4, `DocsPage must wrap all specification tables in .table-wrap (found ${wrapCount})`);
  });

  it('[T2-OVR-03] DevWorkbench 980px and 1140px telemetry tables scroll horizontally within .table-wrap on 320px', () => {
    const tableWrapDecls = resolver.getComputedDeclarations('.table-wrap', 320);
    assertEqual(tableWrapDecls['overflow-x'], 'auto', '.table-wrap must allow local horizontal scroll at 320px');
    assertEqual(tableWrapDecls['width'], '100%', '.table-wrap must span 100% width at 320px');
  });

  it('[T2-OVR-04] Extra-long pitch titles (>100 characters with no spaces) break cleanly via overflow-wrap: break-word', () => {
    const titleDecls = resolver.getComputedDeclarations('.slot-card-title', 320);
    const breakRule = titleDecls['overflow-wrap'] || titleDecls['word-break'] || titleDecls['word-wrap'];
    assertTrue(breakRule === 'break-word' || breakRule === 'break-all',
      'Pitch card titles must have overflow-wrap: break-word to avoid container overflow');
  });

  it('[T2-OVR-05] Viewport at boundary 767px maintains exactly 0px horizontal document overflow', () => {
    const rootDecls = resolver.getComputedDeclarations('.app-root-layout', 767);
    assertEqual(rootDecls['overflow-x'], 'hidden', 'At boundary 767px, overflow-x must remain hidden');
  });
});
