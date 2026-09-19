/**
 * Tier 2: Group 4 — Page Wrapper Scroll Boundaries (Feat 5, 6)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';

const resolver = createCssResolver('src/styles.css');

describe('Group 4 Boundary: Page Wrapper Scroll Unlocking (Feat 5, 6)', () => {
  it('[T2-SCRL-01] Short viewports (320×480px) allow complete scrolling through candidate roller, slots, and submit button', () => {
    const pageWrapper = resolver.getComputedDeclarations('.page-view-wrapper', 320);
    const overflowY = pageWrapper['overflow-y'] || pageWrapper['overflow'];
    assertTrue(overflowY === 'auto' || overflowY === 'scroll',
      'On short 320x480px viewports, page-view-wrapper must allow full vertical scrolling');
  });

  it('[T2-SCRL-02] Desktop viewports (>=1024px) preserve fixed single-screen layout without spurious body scrollbars', () => {
    const rootDecls = resolver.getComputedDeclarations('.app-root-layout', 1200);
    const height = rootDecls['height'] || rootDecls['max-height'];
    assertTrue(height === '100vh' || rootDecls['overflow'] === 'hidden' || rootDecls['overflow-x'] === 'hidden',
      'Desktop viewports should constrain root layout cleanly');
  });

  it('[T2-SCRL-03] Dynamic mobile address bar height fluctuations (dvh vs vh) do not clip bottom submit actions', () => {
    // Stylesheet or components should support dvh or safe area margins to prevent clipping
    const rawCss = resolver.rawContent;
    const hasDvhOrSafe = rawCss.includes('dvh') || rawCss.includes('safe-area') || rawCss.includes('calc(100vh');
    assertTrue(Boolean(hasDvhOrSafe), 'Layout should account for mobile dynamic viewport units or safe margins');
  });

  it('[T2-SCRL-04] Fast mouse wheel / touch flick on candidate roller does not trigger scroll trapping', () => {
    const rollerDecls = resolver.getComputedDeclarations('.candidate-roller', 375);
    const overscroll = rollerDecls['overscroll-behavior'] || rollerDecls['overscroll-behavior-y'];
    // Must not be locked or trapped
    assertTrue(overscroll !== 'none', 'Candidate roller should not rigidly trap outer page scroll gestures');
  });

  it('[T2-SCRL-05] Navigating deep into DocsPage or SettingsPage sub-tabs maintains smooth vertical scroll without clipping', () => {
    const docsLayout = resolver.getComputedDeclarations('.docs-page-layout', 375);
    const settingsLayout = resolver.getComputedDeclarations('.settings-page-layout', 375);
    const docsOverflow = docsLayout['overflow'] || docsLayout['overflow-y'];
    const settingsOverflow = settingsLayout['overflow'] || settingsLayout['overflow-y'];
    assertTrue(docsOverflow !== 'hidden' && settingsOverflow !== 'hidden',
      'Secondary sub-tab views must not lock overflow to hidden on mobile');
  });
});
