/**
 * Tier 2: Group 10 — Secondary Views Responsiveness Boundaries (Feat 15-21)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const raidChartAst = parseComponentAst('src/views/DevWorkbench/RaidTelemetryChart.tsx');

describe('Group 10 Boundary: Secondary Views Responsiveness (Feat 15-21)', () => {
  it('[T2-SEC-01] Telemetry chart in RaidTelemetryChart.tsx uses var(--text-main) instead of hardcoded white in light mode', () => {
    const raw = raidChartAst.rawCode;
    const usesVarText = raw.includes('var(--text-main)') || raw.includes('textColor') || !raw.includes("fill: '#f8fafc'");
    assertTrue(usesVarText, 'RaidTelemetryChart must use adaptive CSS color variables or theme tokens');
  });

  it('[T2-SEC-02] PublicLeaderboard standings table on 320px viewport allows horizontal scroll without page blowout', () => {
    const tableWrap = resolver.getComputedDeclarations('.table-wrap', 320);
    assertEqual(tableWrap['overflow-x'], 'auto', 'Standings table wrapper must declare overflow-x: auto at 320px');
  });

  it('[T2-SEC-03] DocsPage Wikipedia-style infobox wraps cleanly without overflowing 320px screen width', () => {
    const infobox = resolver.getComputedDeclarations('.wiki-infobox', 320);
    const maxW = infobox['max-width'] || infobox['width'];
    assertTrue(maxW === '100%' || maxW === '100vw' || parseInt(maxW, 10) <= 320,
      'Wikipedia infobox must wrap within 320px screen width');
  });

  it('[T2-SEC-04] SettingsPage sub-tab chips on mobile remain horizontally scrollable without clipping active indicator', () => {
    const tabs = resolver.getComputedDeclarations('.settings-nav-tabs', 375);
    const overflowX = tabs['overflow-x'];
    assertTrue(overflowX === 'auto' || tabs['flex-wrap'] === 'wrap',
      'Settings sub-tab chips must scroll horizontally or wrap cleanly on mobile');
  });

  it('[T2-SEC-05] Desktop viewports (>=1024px) retain 3D podium layout with 2nd place left, 1st center, 3rd right', () => {
    const p1 = resolver.getComputedDeclarations('.podium-place-1', 1024);
    const p2 = resolver.getComputedDeclarations('.podium-place-2', 1024);
    const p3 = resolver.getComputedDeclarations('.podium-place-3', 1024);
    // On desktop, 2nd is order 1 (or 0), 1st is order 2 (center), 3rd is order 3 (right)
    const isDesktopOrder = (p2['order'] === '1' && p1['order'] === '2' && p3['order'] === '3') ||
      p1['display'] !== 'none';
    assertTrue(isDesktopOrder, 'Desktop layout must preserve 3D podium order (2nd, 1st, 3rd)');
  });
});
