/**
 * Tier 1: Group 4 — Page Wrapper Scroll Unlocking (Feat 5, 6)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const resolver = createCssResolver('src/styles.css');
const appAst = parseComponentAst('src/App.tsx');
const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');

describe('Group 4: Page Wrapper Scroll Unlocking (Feat 5, 6)', () => {
  it('[T1-SCRL-01] .page-view-wrapper sets overflow-y: auto on viewports <1024px', () => {
    const decls = resolver.getComputedDeclarations('.page-view-wrapper', 767);
    const overflowY = decls['overflow-y'] || decls['overflow'];
    assertTrue(overflowY === 'auto' || overflowY === 'scroll', '.page-view-wrapper must allow vertical scroll on <1024px');
  });

  it('[T1-SCRL-02] page-non-scroll class does not lock vertical scrolling on mobile (<1024px)', () => {
    const decls = resolver.getComputedDeclarations('.page-non-scroll', 375);
    const overflowY = decls['overflow-y'] || decls['overflow'];
    // On mobile, page-non-scroll must not be overflow: hidden
    assertTrue(overflowY !== 'hidden', '.page-non-scroll must not lock vertical scroll to hidden on mobile');
  });

  it('[T1-SCRL-03] VotePage scroll container allows scrolling past candidate cards down to ballot slots', () => {
    const decls = resolver.getComputedDeclarations('.vote-layout-grid', 375);
    // Grid or container must not fix height to 100vh on mobile
    const h = decls['height'] || decls['max-height'];
    assertTrue(h !== '100vh' || decls['overflow-y'] === 'auto',
      'VotePage layout on mobile must not lock height to 100vh without scroll');
  });

  it('[T1-SCRL-04] Cast Ballot submission button is fully reachable via scrolling on mobile viewports', () => {
    // VotePage must render the cast ballot button in normal document flow or reachable sticky section
    const hasCastButton = voteAst.containsPattern(/Cast (Your )?Ballot|cast-ballot|cast-vote/i);
    assertTrue(hasCastButton, 'VotePage must contain a cast ballot action button reachable via scrolling');
  });

  it('[T1-SCRL-05] Switching navigation tabs resets window scroll position to top (scrollTo(0, 0))', () => {
    const hasScrollReset = appAst.containsPattern(/scrollTo\(\s*0\s*,\s*0\s*\)|scrollToTop/i);
    assertTrue(hasScrollReset, 'App tab switching must reset viewport scroll to top');
  });
});
