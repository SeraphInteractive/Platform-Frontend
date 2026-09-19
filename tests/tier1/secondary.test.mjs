/**
 * Tier 1: Group 10 — Secondary Views Responsiveness (Feat 15-21)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const devAst = parseComponentAst('src/views/DevWorkbench/DevWorkbench.tsx');
const docsAst = parseComponentAst('src/views/Docs/DocsPage.tsx');

describe('Group 10: Secondary Views Responsiveness (Feat 15-21)', () => {
  it('[T1-SEC-01] PublicLeaderboard mobile podium displays Gold (1st) above/before Silver and Bronze on <768px', () => {
    const goldDecls = resolver.getComputedDeclarations('.podium-place-1', 375);
    const goldOrder = goldDecls['order'];
    assertTrue(goldOrder === '1' || goldOrder === '-1' || goldOrder === '0',
      'Gold (1st place) must have lower order to render before Silver/Bronze on mobile');
  });

  it('[T1-SEC-02] DocsPage sidebar grid collapses from 1fr 300px to a single column on <768px', () => {
    const decls = resolver.getComputedDeclarations('.docs-page-layout', 375);
    const gridCols = decls['grid-template-columns'];
    assertTrue(gridCols === '1fr' || gridCols === '100%' || decls['display'] === 'block',
      'DocsPage layout must collapse to a single column on mobile');
  });

  it('[T1-SEC-03] SettingsPage 280px sidebar layout collapses to single column on <768px', () => {
    const decls = resolver.getComputedDeclarations('.settings-page-layout', 375);
    const gridCols = decls['grid-template-columns'];
    assertTrue(gridCols === '1fr' || gridCols === '100%' || decls['display'] === 'block',
      'SettingsPage layout must collapse to a single column on mobile');
  });

  it('[T1-SEC-04] DevWorkbench wide telemetry tables are enclosed in .table-wrap containers', () => {
    let hasTableWrap = false;
    devAst.walk((node) => {
      if (node.type === 'JSXElement') {
        const clsAttr = node.openingElement.attributes.find((a) => a.name?.name === 'className');
        if (clsAttr?.value?.value?.includes('table-wrap')) {
          hasTableWrap = true;
        }
      }
    });
    assertTrue(hasTableWrap, 'DevWorkbench must enclose wide telemetry tables within .table-wrap');
  });

  it('[T1-SEC-05] ProgressPage milestone track scales fluidly without overflowing mobile viewport', () => {
    const decls = resolver.getComputedDeclarations('.progress-timeline-track', 375);
    const isResponsive = decls['overflow-x'] === 'auto' || decls['flex-wrap'] === 'wrap' || decls['width'] === '100%';
    assertTrue(isResponsive, 'ProgressPage milestone track must wrap or scroll horizontally on mobile');
  });
});
